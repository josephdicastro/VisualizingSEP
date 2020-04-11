from splinter import Browser
from bs4 import BeautifulSoup
import time
import os

##### Helper Functions for Web Scraping #####


def init_splinter(headlessTF=True):
    """ opens Splinter for scraping """
    # path to Splinter's chromedriver
    executable_path = {'executable_path': 'resources/chromedriver.exe'}
    # start Splinter
    return Browser('chrome', **executable_path, headless=headlessTF)


def init_beautifulsoup(htmlpage_variable, save_as=""):

    # test for save_as. Skip this step if blank, but save file if the argument has been given.
    if save_as != "":
        save_html(htmlpage_variable, save_as)

    # return Beautiful Soup object of selected webpage
    return BeautifulSoup(htmlpage_variable, "lxml")


def save_html(htmlpage_variable, page_to_save):
    """ Save selected variable to an html file """

    print(page_to_save)
    with open(page_to_save, 'w', encoding="UTF-8") as f:
        f.write(htmlpage_variable)



def scrape_web_page(page_url, save_as=""):
    """ Function to scrape individual webpages, using Splinter and Beautiful Soup.

        This function should only be used if Splinter doesn't need to interact with a web page.

        Keyword Arguments:
        page_url -- Page to scrape
        save_as -- Local ile path and name to save the parsed HTML file to.

        Returns:
        BeautifulSoup Result Set
     """

    # open Splinter and visit web page
    browser = init_splinter()
    browser.visit(page_url)

    # pause for 3 seconds to let the page load
    time.sleep(3)

    # get html from web page and save
    soup = init_beautifulsoup(browser.html, save_as)

    # quit Splinter
    browser.quit

    # return Beautiful Soup object of selected webpage
    return soup
