import re
import requests
import json
import pymongo

from tqdm import tqdm
from bs4 import BeautifulSoup

#import local libraries
import lib_webscraping as web

################################################################
##### Helper Functions for SEP Specific Web Scraping ###########
################################################################

def scrape_sep_toc(sep_edition, search_url, base_url, save_as_html):
    """ Downloads the SEP TOC (or Whats New) page for each SEP edition.

        Keyword Arguments:
        sep_edition -- Quarater and Year for each SEP archive
        search_url -- URL for the specific TOC file to download
        base_url -- base URL for all the articles in the current archive
        save_as_html -- Local file path and name to save the downloaded file to.

        Returns:
        List of unique files in the TOC
     """

    #list to hold all unique TOC links
    toc_unique_hrefs = []

    #scrape TOC, save into soup, and then save as local HTML file
    soup = web.scrape_web_page(search_url, save_as_html)

    #get only links to articles in the SEP (ie, only those hrefs that begin with 'entries/') 
    links_in_toc = soup.findAll(href=re.compile('^entries/'))

    #add only unique hrefs and their associated authors to toc_unique_hrefs list
    for link in links_in_toc:
        this_link = soup.find(href=re.compile(link['href']))
        author_string = this_link.next_sibling.strip()
        close_paren = author_string.find(')')
        author = author_string[1:close_paren]
        article_url = { 'link_url': "/" + link['href'],
                        'base_url': base_url,
                        'authors' : author }
                        
        if article_url not in toc_unique_hrefs:
            toc_unique_hrefs.append(article_url)

    return toc_unique_hrefs


def download_sep_pages(page_list, save_as_directory):
    """ Downloads each SEP page listed in a SEP archive.

        Keyword Arguments:
        toc_collection -- List of specific pages to download
        save_as_directory -- Directory to save each file into 

        Returns:
        Nothing. The function only downloads identified pages
     """    
    
    #loop where pages are rendered from
    for page in tqdm(page_list, desc='Processing'):

        #get baseurl and linkurl for each entry, then create absolute path reference to SEP file
        base_url = page['base_url']
        link_url = page['link_url']
        page_url = f'{base_url}{link_url}'
        
        #link_urls are all stored with the following structure: "entries/<pagename>", but 
        #We want to remove the "entries/" page from the link_url and 
        # store the file locally with just the individual page name
        slash_pos = link_url.rfind('/',0,len(link_url)-1)
        page_name = link_url[slash_pos+1:len(link_url)-1]

        html_save_as = f'{save_as_directory}{page_name}.html'

        web.scrape_web_page(page_url, html_save_as)


### FUNCTIONS FOR PARSING THE LOCAL SEP FILES ### 

def return_json_api(inpho_html_page):
    """ Returns proper JSON API URL from InPhO 
        
        SEP links to related InPhO articles are formatted as the name of the SEP article, 
        but the API requests take a different form. When the SEP page is loaded on the InPhO           server, the server transforms the URL into the appropriate format.

        Keyword Arguments:
        inpho_html_page -- HTML URL from SEP Entry into InPhO

        Returns:
        the properly formatted API for a particular InPhO entry

    """
    # get API URL in proper format
    inpho_api = requests.get(inpho_html_page).url

     #not every SEP entry has an InPhO entry. test for this, and return "Error: No InPhO entry"
    if 'redirect=True' in inpho_api:
        inpho_api = 'Error: No InPhO entry'
    else:
        #replace URL and HTML designations with appropriate end point and .json designations
        inpho_api = inpho_api.replace('https://www.inphoproject.org/',\
                                        'http://inpho.cogs.indiana.edu/')\
                                .replace('html','json')

        #taxonomy api urls don't include the '.json' file type reference (but don't know why), so we have to add the file type for these URLS.
        if (inpho_api.find('taxonomy')) != -1:
            inpho_api = inpho_api + '.json'
    
    return inpho_api

def return_json_data(api_endpoint):
    """ Returns JSON object from InPhO
        
        Keyword Arguments:
        api_endpoint -- API endpoint URL for particular InPhO entry.

        Returns:
        Complete JSON object 
    """
    print(api_endpoint)
    #if invalid API_endpoint, return Error
    if api_endpoint == 'Error: No InPhO entry':
        inpho_json = 'Error: No InPhO entry'
    else:
        requests_JSON = requests.get(api_endpoint)
        json_data = json.loads(requests_JSON.text)
        
        #if ["responseData"]["result"] in json_data, pull the child references from it
        if 'responseData' in json_data:
            inpho_json = json_data['responseData']['result']
        else:
            #all good here
            inpho_json = json_data

 
    return inpho_json


def process_links(links_in_page, page_url):
    """ returns a unique list of all outgoing links listed on the page 
        
        Keyword Arguments:
        links_in_page -- list of all links parsed by Beautiful Soup

        Returns:
        a list of unique outgoing links on the page

    """

    unique_links = []
    
    #links within articles take the form of '../<page>', but they have to be transformed 
    #into the form of "/entries/<page>/" for the network graphs
    for link in links_in_page:
        if '.html' not in link['href']:
            link_url = link['href'].replace('..','/entries').replace('//','/').strip()
            last_slash_pos = link_url.find('/',9) + 1
            #/entries/<page>/
            link_url = link_url[0:last_slash_pos]
            if link_url != page_url:
                if link_url != '/entries//':
                    outgoing_link = { 'link': link_url}

            if outgoing_link not in unique_links:
                unique_links.append(outgoing_link)
    
    return unique_links

def parse_sep_file(file_to_parse):
    """ Parse SEP file for all the necessary information 

        Keyword Arguments:
        file_to_parse -- the locally-stored SEP file that is being parsed

        Returns:
        A newly created dictionary object containing all of the information from the file

    """

    #we need to create the current pageurl in the form needed for the network graph arrays: "/entries/<page_url>"
    file_name = file_to_parse.name
    page_url = '/entries/' + file_name.replace('.html','').strip() + '/'

    #open file to scrape
    file_to_read = open(str(file_to_parse),'r', encoding='UTF-8').read()
    soup = BeautifulSoup(file_to_read, 'lxml')

    #get specific page properties
    title = soup.find(id='aueditable').find('h1').get_text().strip()
    pubdate = soup.find(id='pubinfo').get_text().replace('\n',' ').strip()
    copyright = str(soup.find(id='article-copyright')).replace('\n',' ').strip()
    preamble_text = soup.find(id='preamble').get_text().replace('\n',' ').strip()
    main_text = soup.find(id='main-text').get_text().replace('\n',' ').strip()
    toc_text = soup.find(id='toc').get_text().replace('\n',' ').strip()
    toc = str(soup.find(id='toc')).replace('\n',' ').strip()

    #get InPhO API endpoint and retrieve JSON data
    inpho_href = soup.find(href=re.compile('^https://www.inphoproject.org/'))['href']
    inpho_api = return_json_api(inpho_href)
    inpho_JSON = return_json_data(inpho_api)

    #get all outgoing links                    
    article_links = soup.find(id='aueditable').findAll(href=re.compile('^../'))

    #list to hold related links from page
    outgoing_links = process_links(article_links, page_url)

    page_object = { 'page_url': page_url,
                    'title': title,
                    'pubdate': pubdate,
                    'preamble_text': preamble_text,
                    'toc_text': toc_text,
                    'main_text': main_text,
                    'copyright': copyright,
                    'toc': toc,
                    'inpho_href':inpho_href,
                    'inpho_api':inpho_api,
                    'inpho_json':inpho_JSON,
                    'outlinks':outgoing_links }

    return page_object

def update_main_document_data(sep_object):
    """ Updates main dataset when new/revised articles are published in SEP

        Keyword Arguments:
        sep_object -- the mongoDB record

        Returns:
        MongoDB Update_string as Dictionary  

    """

    if sep_object['inpho_json'] == 'Error: No InPhO entry':
        update_string = {'title': sep_object['title'],
                        'pubdate': sep_object['pubdate'],
                        'preamble_text': sep_object['preamble_text'],
                        'toc_text': sep_object['toc_text'],
                        'main_text': sep_object['main_text'],
                        'toc': sep_object['toc'],
                        'copyright': sep_object['copyright'],
                        'outlinks':sep_object['outlinks']}        
    else:
        update_string = {'title': sep_object['title'],
                        'pubdate': sep_object['pubdate'],
                        'preamble_text': sep_object['preamble_text'],
                        'toc_text': sep_object['toc_text'],
                        'main_text': sep_object['main_text'],
                        'toc': sep_object['toc'],
                        'copyright': sep_object['copyright'],
                        'inpho_href': sep_object['inpho_href'],
                        'inpho_api':sep_object['inpho_api'],
                        'inpho_json':sep_object['inpho_json'],
                    'outlinks':sep_object['outlinks']}
    return update_string

def get_author_string(copyright_obj):
    """ This function returns a string of the copyright_obj field """
    soup = BeautifulSoup(copyright_obj, 'lxml')
    copyright_string = soup.get_text()
    by_pos = copyright_string.find('by ') +2
    authors = copyright_string[by_pos:].strip()
    authors_clean = re.sub('<.*?>', '', authors)
    
    return authors_clean

def add_author(url, authors, collection_to_update):
    """ This function adds the 'author' field to a MongoDB document """

    result = collection_to_update.update_one(
        { 'page_url': url },
        { '$set': {'author': authors}},
        upsert=True
    )

    # boolean confirmation that the API call went through
    print (f'acknowledged: {url}\n', result.acknowledged)





def update_sep_json(id_title,api_endpoint, json_type, collection_to_update):
    """ This function updates the JSON data for individually passed articles. """
    
    #check for valid api or not
    if api_endpoint != 'no_api_data':

        #create correct api endoint url
        inpho_api = f'http://inpho.cogs.indiana.edu/{api_endpoint}.json'

        #get JSON data from InPhO
        request_inpho = requests.get(inpho_api)
        inpho_json = json.loads(request_inpho.text)
    else:
        inpho_api = api_endpoint
        inpho_json = {'type': json_type}

    #create udpate string

    new_values = {
        'inpho_api': inpho_api,
        'inpho_json': inpho_json
    }

    # return new_values

    #udpate MongoDB
    result = collection_to_update.update_one(
        { 'title': id_title },
        { '$set': new_values}
    )

    # boolean confirmation that the API call went through
    print (f'acknowledged: {inpho_api}\n', result.acknowledged)

    #get Projection to test update
    doc = list(collection_to_update.find(
            filter={'title': id_title},
            projection=['title','inpho_api', 'inpho_json']))

    print(doc)

def update_domain_info(page_url, domain_tags, primary_domain, collection_to_update):
    """ This function updates the domain data for individually passed articles. """
    
    #create udpate string

    new_values = {
        'domain_tags': domain_tags,
        'primary_domain': primary_domain
    }

    # return new_values

    #udpate MongoDB
    result = collection_to_update.update_one(
        { 'page_url': page_url },
        { '$set': new_values}
    )

    # boolean confirmation that the API call went through
    print (f'acknowledged: {page_url}\n', result.acknowledged)

    #get Projection to test update
    doc = list(collection_to_update.find(
            filter={'page_url': page_url},
            projection=['title','domain_tags', 'primary_domain']))

    print(doc)