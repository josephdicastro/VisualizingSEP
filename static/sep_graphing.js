// ****** Global Variables ******

// Select Page Elements
let svg = d3.select('#graphSVG')
let homePageDiv = d3.select('#homePageDiv')
let aboutPageDiv = d3.select('#aboutPageDiv')
let contactPageDiv = d3.select('#contactPageDiv')
let graphPageDiv = d3.select('#graphPageDiv')
let errorPageDiv = d3.select('#errorPageDiv')
let sidebarLeft = d3.select("#sidebarLeft") 
let sidebarRight = d3.select("#sidebarRight")
let vizLogo = d3.select('#vizLogo')
let navBar = d3.select('nav')
let pageTitle = d3.select('#pageTitle')
let copyright = d3.select('#copyright')
let graphMode = d3.select("#graphMode")
let graphTip = d3.select("#graphTip")
let graphHelp = d3.select("#graphHelp")
let selectedDomainArticle = d3.select('#selectedDomainArticle') 

//Article Search Elements
let articleSearchButton = d3.select('#articleSearchButton')
let articleSearchArea = d3.select('#articleSearchArea')
let articleSearchType = d3.select('#articleSearchType')
let articleSearchFilter = d3.select('#articleSearchFilter')
let articleSearchListDiv = d3.select('#articleSearchListDiv')
let articleShowAllCheck = d3.select('#articleShowAllCheck')
let articleCloseSearchArea = d3.select('#articleCloseSearchArea')
let articleTextSearchButton = d3.select('#articleTextSearchButton')
let articleDetailsPage = d3.select('#articleDetails')
let articleDetailsTip = d3.select('#articleDetailsTip')

//Domain Search elements
let domainSearchButton = d3.select('#domainSearchButton')
let domainSearchArea = d3.select('#domainSearchArea')
let domainSearchFilter = d3.select('#domainSearchFilter')
let domainSearchListDiv = d3.select('#domainSearchListDiv')
let domainShowAllCheck = d3.select('#domainShowAllCheck')
let domainCloseSearchArea = d3.select('#domainCloseSearchArea')
let domainSelectedArticle = d3.select('#selectedDomainArticle')

//Recent Search elements
let recentSearchDiv = d3.select('#recentSearchDiv')
let recentSearchButton = d3.select('#recentSearchButton')
let recentSearchArea = d3.select('#recentSearchArea')
let recentSearchFilter = d3.select('#recentSearchFilter')
let recentSearchListDiv = d3.select('#recentSearchListDiv')
let recentShowAllCheck = d3.select('#recentShowAllCheck')
let recentCloseSearchArea = d3.select('#recentCloseSearchArea')

//Other Nav Elements
let getRandomEntry = d3.select("#getRandomEntry")
let aboutPageLink = d3.select('#aboutPage')
let contactPageLink = d3.select('#contactPage')



//about Page Elements
let aboutNumArticles = d3.select("#aboutNumArticles")
let aboutNumLinks = d3.select("#aboutNumLinks")
let aboutNumDomains = d3.select("#aboutNumDomains")
let aboutAvgWordCount = d3.select("#aboutAvgWordCount")

//Initialize nodes and links arrays for simulation
let graphNodes = [];
let graphLinks = [];

//Init cache and search arrays
let searchCache = [];

let allArticles = [];
let allDomains = [];
let allEntries = [];
let recentSearches = [];

// Initialize SVG and Simulation
let svgConfig = initializeParentSVG(svg);
let simConfig = initializeSimulation(svgConfig);  
let styConfig = initializeStyles();

// graph helpers
let showAll = false;
let graphType;
let neighborNodes = [];
let linkAngles = [];
let exploreMode = false;
let priorNodeCircle;
let priorNodeCircle_ListItem;
let currentDomainCentralNode;

//used to set/check panel value for dimScreen('details')
let panelOpacityValue = 1;

let pageTransition = 300


//set BaseURL for SEP Edition
let sepEdition = "Fall 2020"
let baseURL = 'https://plato.stanford.edu/archives/fall2020';
let domainName = 'http://localhost:8000/'

let json_file = 'static/sep_network.json'


startVisualization();


  // listen for changes to url  
  window.addEventListener('popstate', function(e) {
        processURL();
  }, false);

// listen for changes to url  
window.addEventListener('hashchange', function() {
    processURL();
  }, false);




// ****** BEGINNING OF CODE FUNCTIONS *******

function startVisualization() {
    loadMenuData();

}


// ****** INITIALIZATION FUNCTIONS ********

function setGlobalNodesLinks(sepData) {
    //clear out whatever is in the global graphNodes and graphLinks arrays
    graphNodes.length = 0
    graphLinks.length = 0

    //push new nodes and links objects into globals
    sepData.nodes.forEach(node => graphNodes.push(node))
    sepData.links.forEach(link => graphLinks.push(link))

}

function initializeParentSVG(svg) {
    // set basic SVG Config data 
    let margin = {
        top: 0,
        right: 0,
        bottom:0,
        left:0
    };

    let areaWidth = 1000;
    let areaHeight = 900;

    // let areaWidth = 1100;
    // let areaHeight = 1000;

    let width = areaWidth - margin.left - margin.right;
    let height = areaHeight - margin.top - margin.bottom;

    svg.attr("viewBox", "0 75 " + width + " " + height )
       .attr("preserveAspectRatio", "xMidYMid")

    //clear out child SVG elements
    svg.html("")

    //create SVG group centered in the middle of the svg space
    let g1 = svg.append('g')
                        .attr("transform", `translate(${width/2},${height/2})`)
                        .classed('sepGraphGroup', true)
    
    //create secondary svg group so that we can add our graph elements to this group
    let graphElements = g1.append('g')
                            .classed('graphElements', true)
                            // .attr('width',1000)

    return {margin, areaWidth, areaHeight, width, height, graphElements}
}

function initializeSimulation(svgConfig) {

    // create main graph elements
    let links = svgConfig.graphElements
        .append("g")
        .classed('links',true)

    let labels = svgConfig.graphElements
        .append("g")
        .classed('labels',true)

    let relatedLinks = svgConfig.graphElements
        .append("g")
        .classed('relatedLinks', true)

    let nodes = svgConfig.graphElements
        .append("g")
        .classed('nodes',true)

    let domainLabels = svgConfig.graphElements
        .append("g")
        .classed('domainLabels',true)

    let simulation = d3.forceSimulation()
    simulation
        .nodes(graphNodes)
        .force("charge", d3.forceManyBody())
        .force("link", d3.forceLink())
        .force("center", d3.forceCenter())
        .force('collide', d3.forceCollide())
        .force('forceX', d3.forceX())
        .force('forceY', d3.forceY())
        .alphaTarget(0.98)

    return {links, nodes, labels, relatedLinks, domainLabels, simulation}
}

function initializeStyles() {
    let link = { 
        'defaultOpacity': 0.1,
        'activeOpacity': 0.3,
        'activeDomainOpacity': 0.08,
        'inactiveOpacity': 0.06,
        'inactiveDomainOpacity': 0.01,
        'strokeColor': '#999',
        'strokeWidth':1
    }
    
    let nodeLabel = {
        'defaultOpacity': 1,
        'centralNodeDimmedOpacity': 0.8,
        'neighborNodeOpacity': 0.25,
        'inArrayOpacity': 1,
        'notInArrayOpacity': 0.03,
        'defaultFontSize': '1.3em', 
        'largeGraphFontSize': '.5em',
        'defaultRadius': 4,
        'strokeColor': "#fff",
        'strokeWidth':0.5 
    }

    let linkLines = {
        'articleGraphOpacity': 0.4,
        'domainGraphOpacity': 0.5,
        'inactiveOpacity':0
    }

    let listItems = {
        'defaultOpacity': 1,
        'dimmedOpacity': 0.21
    }

    return {link, nodeLabel, linkLines, listItems}


}

// ****** MENU FUNCTIONS ********

function loadMenuData() {

    d3.json(json_file).then((json) => {

        let wordCount = 0;

        // load articles and primary domain data
        json.articles.nodes.forEach(node => {
            let nodeTitle = node.title
            let nodeID = node.id
            let nodePrimaryDomain = node.primary_domain
            let wordCountText = parseInt(node.word_count.replace(',',''))
            allArticles.push({'title': nodeTitle, 'id':nodeID, 'primary_domain': nodePrimaryDomain})
            // domainSet.add(nodePrimaryDomain)
            wordCount += wordCountText
            
        })

        //load just the individual domains
        json.domains.forEach(domain => {
            let domainID = domain.toLowerCase().replace(/\s+/g,'-')
            allDomains.push({'title': domain, 'id': domainID, 'primary_domain':domain})
        })
        allDomains.sort((a,b) => d3.ascending(a.title, b.title));

        //create super array of all possible objects. This is used in the getRandom() function
        allEntries = allArticles.concat(allDomains)

        //load variables for the 
        aboutNumArticles.text(allArticles.length.toLocaleString())
        aboutNumLinks.text(json.articles.links.length.toLocaleString())
        aboutNumDomains.text(allDomains.length)
        aboutAvgWordCount.text(parseInt(wordCount/allArticles.length).toLocaleString())

        // after menu is loaded, then setNavigation and test for URL parameters
        setNavigation();
        processURL();

        })

}

function updateRecentSearch(searchObj, graphType) {
    
    if(!recentSearches.includes(searchObj)) { 

        if (graphType==='Domain') {searchObj.title = searchObj.title + ' (domain)'}
        let testSearch = recentSearches.filter(node => {return node.title === searchObj.title})
        if(testSearch.length === 0) {recentSearches.push(searchObj) }
        if(recentSearches.length > 10 ) {recentSearches.shift()}
    }

}

function searchSEP(searchString) {

    let stringCleaned = searchString.replace(/\s/g,'+')
    let sepSearchURL = 'https://plato.stanford.edu/search/searcher.py?query=' + stringCleaned

    window.open(sepSearchURL, '_blank')
}


// ****** BASIC PAGE SHOW / HIDE FUNCTIONS ****** 
 
function setNavigation() {

    setNavBarTransition() 
    setHomePage()
    setArticleSearchElements();
    setDomainSearchElements();
    setRecentSearchElements();
    setGetRandomEntry();
    setAboutPage();
    setContactPage();

    let preservePanel = false;

    function setNavBarTransition() {
        navBar
            .style('opacity',1)
            .on('end', function() {
                populateSearchResults(domainSearchListDiv, allDomains); 
                domainShowAllCheck.property('checked', true)
            })
    }

    function setHomePage() {   
        vizLogo
            .on('mouseover', function() { if(isNavFullOpacity()) {activateItemLink(this)}})
            .on('mouseout', function() { deActivateItemLink(this)})
            .on('click', function() { if(isNavFullOpacity()) {showHomePage(); }})
    }

    // Article Searches
    function setArticleSearchElements() {

        //set default search Type
        setArticleSearchType('title')
        // article search features
        articleSearchButton
            .on('mouseover', function() { 
                if(isNavFullOpacity()) {
                    articleSearchButton
                        .classed('searchButtonActive', true)
                        .style('cursor','pointer')
                }
            })
            .on('mouseout', function() {articleSearchButton.classed('searchButtonActive', false)})
            .on('click', function() { if(isNavFullOpacity()) { toggleArticleSearchArea(); }})

        articleSearchType
            .on('change', function() { 
                let searchType = d3.event.target.value
                setArticleSearchType(searchType)
            })

        articleTextSearchButton
            .on('mouseover', function() {activateItemLink(this)})
            .on('mouseout', function() {deActivateItemLink(this)})
            .on('click', function() {
                let searchFilter = articleSearchFilter.property('value')
                console.log(searchFilter)
                searchSEP(searchFilter)
            })

        articleSearchFilter
            .on('keyup', function() {
                let articleFilter = d3.event.target.value
                let searchType = d3.select('input[name="searchType"]:checked').property("value");
                if(searchType==='title') {
                    if(articleFilter.length === 0 || articleFilter.trim() === '') {
                        populateSearchResults(articleSearchListDiv, [])
                        showAll = false;
                    }   else {
                        filterSearchList('Article',articleFilter);
                        showAll = false;
                    }
                }

            })

        articleShowAllCheck
            .on('click', function() {
                let chkStatus = articleShowAllCheck.property('checked')
                if(chkStatus) {
                    showAll = true; 
                    populateSearchResults(articleSearchListDiv,allArticles); 
                }
                if(!chkStatus) {
                    showAll = true; 
                    populateSearchResults(articleSearchListDiv,[]); 
                }
                articleSearchFilter.node().focus()

            })

        articleCloseSearchArea
            .on('mouseover', function() {activateItemLink(this)})
            .on('mouseout', function() {deActivateItemLink(this)})
            .on('click', function() {hideArticleSearchArea()})
    }

    function setArticleSearchType(searchType) {
        let titleSearchTip = d3.select('#titleSearchTip')
        let textSearchTip = d3.select('#textSearchTip')

        if(searchType==='title') {
            titleSearchTip
                .transition().duration(pageTransition)
                    .style('display','block')
                    .style('opacity',1)
            textSearchTip
                .transition().duration(pageTransition)
                    .style('opacity',0)
                    .style('display','none')
            articleTextSearchButton
                .transition().duration(pageTransition)
                    .style('opacity',0)
        }
        articleTextSearchButton
        if(searchType==='text') {
            titleSearchTip
                .transition().duration(pageTransition)
                    .style('opacity',0)
                    .style('display','none')

            textSearchTip
                .transition().duration(pageTransition)
                    .style('display','block')
                    .style('opacity',1)
            articleTextSearchButton
                .transition().duration(pageTransition)
                    .style('opacity',1)
    }
        articleSearchFilter.property('value', '')
        populateSearchResults(articleSearchListDiv, [])
        setFocusTo(articleSearchFilter)
    }

    function toggleArticleSearchArea() {
        let articleSearchAreaVis = articleSearchArea.style('display')
        if (articleSearchAreaVis === 'block') {
            hideArticleSearchArea();
        }   else {
            showArticleSearchArea();
        }
    }
    
    function showArticleSearchArea(){

        closeDropdowns()

        articleSearchArea.style('display', 'block')
        articleSearchButton.classed('searchButtonActive', true)
        articleSearchListDiv.style('display', 'block')
        articleSearchFilter.node().focus()
        articleShowAllCheck.property('checked', false)
    
    }
    
    function hideArticleSearchArea(){
        articleSearchArea
            .style('display', 'none')
    
        articleSearchListDiv.html('')
        articleSearchFilter.property('value','')
        articleShowAllCheck.property('checked', false)
    
    }

    // get random
    function setGetRandomEntry() {
        getRandomEntry
            .on('mouseover', function() { if(isNavFullOpacity()) {activateItemLink(this)}})
            .on('mouseout', function() { deActivateItemLink(this)})
            .on('click', function() { if(isNavFullOpacity()) {closeDropdowns(); getRandom() }})
    }

    // domain searches
    function setDomainSearchElements() {

        domainSearchButton
            .on('mouseover', function() {domainSearchButton.classed('searchButtonActive', true)})
            .on('mouseout', function() {domainSearchButton.classed('searchButtonActive', false)})
            .on('click', function() {if(isNavFullOpacity()) { toggleDomainSearchArea();}})

        domainSearchFilter
            .on('keyup', function() {
                let domainFilter = d3.event.target.value
                if(domainFilter.length === 0 || domainFilter.trim() === '' ) {
                    populateSearchResults(domainSearchListDiv, allDomains)
                    domainShowAllCheck.property('checked', true)
                }   else {
                    domainShowAllCheck.property('checked', false)
                    filterSearchList('Domain',domainFilter);
                }
            })

        domainShowAllCheck
            .on('change', function() {
                let chkStatus = domainShowAllCheck.property('checked')
                if(chkStatus) {
                    populateSearchResults(domainSearchListDiv, allDomains)
                    domainShowAllCheck.property('checked', true)
                }   else {
                    populateSearchResults(domainSearchListDiv, [])
                    domainShowAllCheck.property('checked', false)
                }
                domainSearchFilter.node().focus();
            })

        domainCloseSearchArea
            .on('mouseover', function() {activateItemLink(this)})
            .on('mouseout', function() {deActivateItemLink(this)})
            .on('click', function() {hideDomainSearchArea()})
    }

    function toggleDomainSearchArea() {
        let domainSearchAreaVis = domainSearchArea.style('display')
        if (domainSearchAreaVis === 'block') {
            hideDomainSearchArea();
        }   else {
            showDomainSearchArea();
        }
    }

    function showDomainSearchArea(){

        closeDropdowns()
        
        domainSearchArea.style('display', 'block')
        domainSearchButton.classed('searchButtonActive', true)
        domainSearchListDiv.style('display', 'block')
        domainShowAllCheck.property('checked', true)
        domainSearchFilter.node().focus()
        populateSearchResults(domainSearchListDiv, allDomains)
    
    }

    function hideDomainSearchArea(){

        domainSearchArea.style('display', 'none')
        domainSearchFilter.property('value','')
        domainShowAllCheck.property('checked', true)

    }

    // Recent Searches

    function setRecentSearchElements() {

        recentSearchButton
            .on('mouseover', function() {recentSearchButton.classed('searchButtonActive', true)})
            .on('mouseout', function() {recentSearchButton.classed('searchButtonActive', false)})
            .on('click', function() {if(isNavFullOpacity()) {  toggleRecentSearchArea();}})

        recentSearchFilter
            .on('keyup', function() {
                let recentFilter = d3.event.target.value
                if(recentFilter.length === 0 || recentFilter.trim() === '' ) {
                    populateSearchResults(recentSearchListDiv, recentSearches)
                    recentShowAllCheck.property('checked', true)
                }   else {
                    recentShowAllCheck.property('checked', false)
                    filterSearchList('Recent',recentFilter);
                }
            })

        recentShowAllCheck
            .on('change', function() {
                let chkStatus = recentShowAllCheck.property('checked')
                if(chkStatus) {
                    populateSearchResults(recentSearchListDiv, recentSearches)
                    recentShowAllCheck.property('checked', true)
                }   else {
                    populateSearchResults(recentSearchListDiv, [])
                    recentShowAllCheck.property('checked', false)
                }
                recentSearchFilter.node().focus();
            })

        recentCloseSearchArea
            .on('mouseover', function() {activateItemLink(this)})
            .on('mouseout', function() {deActivateItemLink(this)})
            .on('click', function() {hideRecentSearchArea()})
    }

    function toggleRecentSearchArea() {
        let recentSearchAreaVis = recentSearchArea.style('display')
        if (recentSearchAreaVis === 'block') {
            hideRecentSearchArea();
        }   else {
            showRecentSearchArea();
        }
    }

    function showRecentSearchArea(){

        closeDropdowns()
        
        recentSearchArea.style('display', 'block')
        recentSearchButton.classed('searchButtonActive', true)
        recentSearchListDiv.style('display', 'block')
        recentShowAllCheck.property('checked', true)
        recentSearchFilter.node().focus()
        populateSearchResults(recentSearchListDiv, recentSearches)
        preservePanel = false;
        
    }

    function hideRecentSearchArea(){

        recentSearchArea.style('display', 'none')
        recentSearchFilter.property('value','')
        recentShowAllCheck.property('checked', true)

    }

    function closeDropdowns() {
        hideArticleSearchArea();
        hideDomainSearchArea();
        hideRecentSearchArea();
    }


    
    // Search Process functions 
    function setFocusTo(element) {
        element.node().focus()
    }

    function populateSearchResults(searchAreaDiv, arrayOfTitles) {
        searchAreaDiv.html('')
        searchAreaDiv
            .transition().duration(pageTransition)
                .style('display', 'block')
                .style('opacity', 1)

            searchAreaDiv.append('ul')
                .selectAll('.searchResults')
                .data(arrayOfTitles)
                    .enter()
                    .append('li')
                        .append('a')
                        // .attr('href','#')
                        .text(function(d) {return d.title})
                        .style('color', function(d) {return color(d.primary_domain)})
                    .classed('searchResults', true)
                    .classed('dropDownMenuListItem', true)
                    .classed('dropDownMenuLink', true)

                .exit().remove()
        
            d3.selectAll('.searchResults')
                .on('focusin', function () { preservePanel = true})
                .on('click', function() { 
                    let searchDivID = searchAreaDiv.node().id
                    let searchTitle = d3.select(this).datum().title
                    if (searchDivID.includes('article')) {
                        showArticleGraph(searchTitle)
                        hideArticleSearchArea()
                    }
                    if (searchDivID.includes('domain')) {
                        showDomainGraph(searchTitle)
                        hideDomainSearchArea()
                    }
                    if (searchDivID.includes('recent')) {
                        let domainPosition = searchTitle.indexOf(' (domain)');
                        if( domainPosition === -1) {
                            showArticleGraph(searchTitle)
                        }   else    {
                            showDomainGraph(searchTitle.substring(0,domainPosition))
                        }
                        hideRecentSearchArea();
                    }
                    preservePanel = false
                })

    }

    function returnNoResults(searchAreaDiv) {
        searchAreaDiv.html('')
        searchAreaDiv.append('h2')
        .text('Nothing Found')
        .classed('searchFilterResults', true)
    }

    function filterSearchList(graphType, searchString) {  
        let matchedTitles;
        let searchdDiv;
        switch (graphType) {
            case 'Article':
                if(searchString === '*ALL*') {
                    matchedTitles = allArticles.map(node => node.title)
                }   else    {
                    matchedTitles = allArticles.filter(node => node.title.toLowerCase().includes(searchString.toLowerCase()) )
                }
                searchDiv = articleSearchListDiv
                break;

            case 'Domain':
                matchedTitles = allDomains.filter(node => node.title.toLowerCase().includes(searchString.toLowerCase()) )
                searchDiv = domainSearchListDiv
                break;

            case 'Recent':
                matchedTitles = recentSearches.filter(node => node.title.toLowerCase().includes(searchString.toLowerCase()) )
                searchDiv = recentSearchListDiv
                break;

        }
        if (matchedTitles.length > 0 ) {
            populateSearchResults(searchDiv, matchedTitles)
        }   else    {
            returnNoResults(searchDiv)
        }
    }

    function setAboutPage(){

        aboutPageLink
            .on('mouseover', function() { if(isNavFullOpacity()) { activateItemLink(this)}})
            .on('mouseout', function() { deActivateItemLink(this)})
            .on('click', function() { if(isNavFullOpacity()) { showAboutPage();}})

    }

    function setContactPage() {
        contactPageLink
            .on('mouseover', function() { if(isNavFullOpacity()) { activateItemLink(this)}})
            .on('mouseout', function() { deActivateItemLink(this)})
            .on('click', function() { if(isNavFullOpacity()) { showContactPage()}})

        copyright
            .on('mouseover', function() { if(isNavFullOpacity()) { activateItemLink(this)}})
            .on('mouseout', function() { deActivateItemLink(this)})
            .on('click', function() { if(isNavFullOpacity()) {  showContactPage()}})
    }

}

function isNavFullOpacity() {
    let navIsFull = true
    let navOpacity = parseFloat(navBar.style('opacity'))
    if(navOpacity !== 1) {navIsFull = false}
    return navIsFull
}

function setPageTitle(pageTitleText,primaryDomain) {
    let selectedPageTitle = pageTitle.select("h1")
    selectedPageTitle
        .text(pageTitleText)
        .style("color", function(d) {return color(primaryDomain)})
        .classed('pageTitle',true)

}

function showContentPage (pageToShow, pageTitleText) {    
    hideSidebars();

    hidePage(homePageDiv);
    hidePage(graphPageDiv);
    hidePage(aboutPageDiv);
    hidePage(contactPageDiv);
    hidePage(errorPageDiv);



    pageToShow
        .style('display', 'block')
        .transition().duration(pageTransition)
            .style('opacity',1)

    setPageTitle(pageTitleText, 'Default Page')


}

function hidePage(pageToHide) {
    if (pageToHide.style('display') === 'block') {
        pageToHide.transition().duration(pageTransition).style('opacity',0);
        pageToHide.style('display','none')
    }
}

function hideSidebars(){
    sidebarLeft
        .transition().duration(pageTransition)
        .style('opacity',0);

    sidebarRight
        .transition().duration(pageTransition)
        .style('opacity',0)

}

function showSidebars(){
        sidebarLeft
        .transition().duration(pageTransition)
        .style('opacity',1)

        sidebarRight
        .transition().duration(pageTransition)
        .style('opacity',1)
}

function showGraphPage() {
    hidePage(homePageDiv);
    hidePage(aboutPageDiv);
    hidePage(contactPageDiv);
    hidePage(errorPageDiv)

    // resetScreen();

    showSidebars();

    graphPageDiv
        .classed('panelBG_graph', 'true')
        .style('display','block')
        .transition()
            .duration(pageTransition).style('opacity',1);
}

function showHomePage() {
    let url = ''
    let htmlTitle = 'Visualizing SEP: An interactive data visualization of the Stanford Encyclopedia of Philosophy'
    updateBrowser(url,htmlTitle)
    showContentPage(homePageDiv,'')

}
function showAboutPage() {
    let url = '/about'
    let htmlTitle = 'About Visualizing SEP'
    updateBrowser(url,htmlTitle)
    showContentPage(aboutPageDiv,htmlTitle)
}

function showContactPage() {
    let url = "/contact"
    let htmlTitle = 'Contact Information'
    showContentPage(contactPageDiv, htmlTitle)
    updateBrowser(url,htmlTitle)
}

function show404Page() {
 
    let url = "/404"
    let htmlTitle = '404: Page Not Found'
    showContentPage(errorPageDiv, htmlTitle)
    updateBrowser(url,htmlTitle)

}

// ****** URL ROUTING & BROWSER  UPDATES ****** 

// read URL and route to appropriate endpoint
function processURL() {
    let urlHash = window.location.hash

    //if urlHash does not indicate an article or domain graph
    if(urlHash.indexOf('entries') === -1 && urlHash.indexOf('domain') === -1) {

        // check for home page
        if (urlHash === '' || urlHash === '#' || urlHash === '/#' || urlHash === '/#/' || urlHash === '#/') {
            showHomePage();

        // check for about page
        } else if (urlHash === '#/about' || urlHash === '#/about/') {
            showAboutPage();

        // check for contact page
        } else if (urlHash === '#/contact' || urlHash === '#/contact/') {
            showContactPage();

        // check for 404 page
        } else if (urlHash === '#/404' || urlHash === '#/404/') {
            show404Page();
        
        // any other URL is bad, and needs to go to 404
        } else {
            show404Page();
        }

    } else {

        //if urlHash contains 'entries' then this is an article. check for valid article, or route to 404
        if(urlHash.indexOf('entries') !== -1) {
            processArticle(urlHash)
        }

        //if urlHash contains 'entries' then this is an article. check for valid article, or route to 404
        if(urlHash.indexOf('domain') !== -1) {
            processDomain(urlHash)
        }

    }
}

function processArticle(urlHash) {
    let hashPosition = urlHash.indexOf('#') + 1
    let articleID = urlHash.substring(hashPosition)
    let articleObj = allArticles.filter(article => article.id === articleID)

    if(articleObj.length !== 0) {
        showArticleGraph(articleObj[0].title)
    }   else {
        show404Page(urlHash);
    }

}

function processDomain(urlHash) {
    let hashPosition = urlHash.indexOf('#/domain/') + 9
    let domainID = urlHash.substring(hashPosition)
    let domainObj = allDomains.filter(domain => domain.id === domainID)

    if(domainObj.length !== 0) {
        showDomainGraph(domainObj[0].title)
    }   else {
        show404Page(urlHash);
    }
}

function updateBrowser(url, title) {
    let urlTarget = "#" + url

    if(urlTarget !== location.hash) {
        window.history.pushState({'id':urlTarget}, null, urlTarget);
        document.title = title;
    }

}



// ****** SET GRAPH MODE AND SET HELP PAGE FUNCTIONS  ****** 


function setNavTip(state) {
   if(state === 'On') {
        graphTip
            .transition().duration(pageTransition)
                .style('opacity',1)
                .style('display', 'block')
   }    else    {
        graphTip
            .transition().duration(pageTransition)
                .style('opacity',0)
                .style('display', 'none')
   }


}
function setGraphMode(mode) {

    graphMode
        .classed('graphModeHelpCallout', true)
        .classed('graphModeBGImage',true)
        .text('Reset Graph')
        .on('mouseover', function() {activateItemLink(this)})
        .on('mouseout', function() {deActivateItemLink(this)})
        .on('click', function() {setGraphMode('Hover');})

    if(mode==='Hover') {
        exploreMode = false; 

        resetDomainMenuOpacity();
        resetDisplayDefaultsDomainGraph();
        resetDisplayDefaultsArticleGraph();
        graphMode.transition().duration(pageTransition).style('opacity',0)
  }
    if(mode==='Click') {
        exploreMode = true;
        graphMode.transition().duration(pageTransition).style('opacity',1)
    }
}

function setGraphType(graphState) {

    let graphHelpText;
    let helpPageToOpen;

    if(graphState==='Article') {
        graphHelpText = "Quick Tip: <strong>Single-click</strong> node to freeze graph; <strong>Double-click</strong> node to load new graph."
        helpPageToOpen = '#graphHelpArticle'
    }
    if(graphState==='Domain') {
        graphHelpText = "Quick Tip: <strong>Single-click</strong> node to freeze Domain graph; <strong>Double-click</strong> node to load node into new Article graph."
        helpPageToOpen = '#graphHelpDomain'
    }

    graphTip
        .html(graphHelpText)

    graphHelp
        .classed('graphModeHelpCallout', true)
        .classed('graphHelpBGImage',true)
        .on('mouseover', function() {activateItemLink(this)})
        .on('mouseout', function() {deActivateItemLink(this)})
        .on('click', function() { toggleHelpPage(helpPageToOpen)})

    graphType = graphState
}

function dimScreen(pageType) {
    let transDuration = 300

    navBar.transition(transDuration).style('opacity', 0.25)
    pageTitle.transition(transDuration).style('opacity', 0.25)
    svgConfig.graphElements.transition(transDuration).style('opacity', 0.25)
    graphHelp.transition(transDuration).style('opacity', 0.25)
    graphTip.transition(transDuration).style('opacity', 0.25)
    if(graphMode.style('opacity') === 1 ) {
        graphMode.transition(transDuration).style('opacity',0.10)
    }

    if(graphTip.style('opacity') === 1 ) {
        graphTip.transition(transDuration).style('opacity',0.10)
    }

    switch(pageType) {
        case 'help':
            sidebarLeft.transition(transDuration).style('opacity', 0.25)
            sidebarRight.transition(transDuration).style('opacity', 0.25)
            break;

        case 'details':
            d3.select('#articleIntroParagraphPanel').transition(transDuration).style('opacity', 0.25)
            d3.select('#domainIntroPanel').transition(transDuration).style('opacity', 0.25)
            
            break;

    }





}

function resetScreen() {
    let transDuration = 300

    hideAllHelpPages()

    navBar.transition(transDuration).style('opacity', 1)
    pageTitle.transition(transDuration).style('opacity', 1)
    sidebarLeft.transition(transDuration).style('opacity',1)
    sidebarRight.transition(transDuration).style('opacity', 1)
    svgConfig.graphElements.transition(transDuration).style('opacity',1)
    graphHelp.transition(transDuration).style('opacity', 1)

    if(graphMode.style('opacity') === 0.10 ) {
        graphMode.transition(transDuration).style('opacity',1)
    }

    if(graphTip.style('opacity') > 0 ) {
        graphTip.transition(transDuration).style('opacity',1)
    }

    d3.select('#articleIntroParagraphPanel').transition(transDuration).style('opacity',1)
    d3.select('#domainIntroPanel').transition(transDuration).style('opacity', 0.25)

}

function displayHelpPage(helpPageToDisplay) {
    dimScreen('help');
    hideAllHelpPages()

    d3.select(helpPageToDisplay)
        .classed('scrollbars', true)
        .style('display', 'block')
        .transition()
            .duration(pageTransition)
                .style('opacity',1)

    let closePageDiv = d3.select(helpPageToDisplay).append('div')
        .text('Close Page')
        .classed('closePageArea',true)
        .classed('graphModeHelpCallout', true)


    d3.selectAll('.instructionsPageHeading')
        .on('mouseover', function() {activateItemLink(this)})
        .on('mouseout', function() {deActivateItemLink(this)})
        .on('click', function() { hideHelpPage(helpPageToDisplay)})

    d3.selectAll('.closePageArea')
        .on('mouseover', function() {activateItemLink(this)})
        .on('mouseout', function() {deActivateItemLink(this)})
        .on('click', function() { closePageDiv.remove(); hideHelpPage(helpPageToDisplay)})
}

function hideHelpPage(helpPageToDisplay) {
    d3.select(helpPageToDisplay)
        .transition()
            .duration(pageTransition).style('opacity',0)

    d3.select(helpPageToDisplay)
        .style('display','none')

    resetScreen();
}

function hideAllHelpPages() {
    d3.selectAll('.graphInstructionArea')
        .style('opacity', 0)
        .style('display','none')

}

function toggleHelpPage(helpPageToDisplay) {
   let helpPageVizibility = d3.select(helpPageToDisplay).style('display')

   if (helpPageVizibility === 'none') {
        displayHelpPage(helpPageToDisplay)
   }    else{
       hideHelpPage(helpPageToDisplay)
   }
}

// ****** ARTICLE GRAPH DATA AND SIMULATION FUNCTIONS ****** 
function showArticleGraph(articleTitle) {
    d3.json(json_file).then((json) => {

        //get data from JSON and update globals
        let articleData = getArticleData(json,articleTitle)
        setGlobalNodesLinks(articleData)
        let articleNode = graphNodes[0]

        //setup graph to display article data
        showGraphPage();
        resetScreen()
        setGraphMode('Hover')
        setGraphType('Article')

        //update graph 
        drawArticleSimulation(json)
        setPageTitle(articleTitle, articleData.primaryDomain)
        updateSidebarsArticle(json, articleNode);

        updateBrowser(articleData.id,articleTitle)


        resetDisplayDefaultsDomainGraph();
        resetDisplayDefaultsArticleGraph();
        d3.select('.mainDomainNode').remove();

        //update nav menu 
        updateRecentSearch({'title': articleTitle, 'primary_domain': articleData.primaryDomain},'Article');
        showAll = false;

        //remove selections
        window.getSelection().removeAllRanges();
    })

}
function getArticleData(data, articleTitle) {
    let articleData = {};
    let inCache = searchCache.find( ({article}) => article === articleTitle);
    if (!inCache) {
        articleData = getArticleDataFromJSON(data, articleTitle); 
    }   else    {
        articleData = inCache
    }

    return articleData
}
function getArticleDataFromJSON(data, articleTitle) {      

    //get the selectded article node to build our graph around    
    let selectedArticle = data.articles.nodes.filter(node => {
        return node.title === articleTitle
    })

    //get the url for the selectded article node
    let articleURL = selectedArticle[0].id;
    let articlePrimaryDomain = selectedArticle[0].primary_domain

    // get all the links going out from the selected article
    let sourceLinks = [];
    let targetLinks = [];
    
    data.articles.links.forEach(link => {
        if (link.source === articleURL) {sourceLinks.push(link.target)}
        if (link.target === articleURL) {targetLinks.push(link.source)}
    });
    
    // break links out into arrays based on link direction
    let bidirectionalLinks = intersection(sourceLinks,targetLinks);
    let onlyOutLinks = symmetricDifference(bidirectionalLinks, sourceLinks);
    let onlyInLinks = symmetricDifference(bidirectionalLinks, targetLinks);

    // combine links back together into a single array 
    let articleLinks = combineLinks(articleURL, bidirectionalLinks, onlyOutLinks, onlyInLinks);

    // create array to hold the article node objects
    let articleNodes = []; 

    // push selected article into first position of node array
    articleNodes.push(selectedArticle[0]);

    // get all nodes that are linked to from the articleLinks array
    let domains = {}
    articleLinks.forEach(link => {
        data.articles.nodes.forEach(node => {
            if (node.id === link.target) {
                //push this node into the articleNodes array
                articleNodes.push(node)
                //build a domain object containing a list and a count of which domains are represented among the nodes
                if (domains[node.primary_domain] > 0 ) {
                    domains[node.primary_domain]++ 
                }   else {
                    domains[node.primary_domain] = 1
                }
            }
        })
    }) 

    //create array from domains object and then sort the domains alphabetically
    let linkDomains = Object.entries(domains);
    linkDomains.sort((a,b) => d3.ascending(a[0], b[0]));

    //store the articleData term as an object
    let articleData = { "article": articleTitle,
                        "id":articleURL,
                        "nodes": articleNodes,
                        "links": articleLinks,
                        "biLinks": bidirectionalLinks,
                        "inLinks": onlyInLinks,
                        "outLinks": onlyOutLinks, 
                        "linkDomains": linkDomains,
                        "primaryDomain": articlePrimaryDomain  }
    
    //add to cache
    searchCache.push(articleData)

    return articleData

}
function drawArticleSimulation(data) { 

    let centralNode = graphNodes[0];
    let countOfNodes = graphNodes.length;
    let transitionTime = 2000;

    d3.selectAll('.mainArticleLabelArea').remove();

    //links
    link = simConfig.links.selectAll('.link')
                         .data(graphLinks, function(d) {return `${d.source}-${d.target}`})
                         .order()
                         .attr('dir', function(d) {return d.dir})
                         .attr('target', function(d) { return d.target })

    link.exit().remove();

    link = link.enter()
               .append('line')
               .attr("stroke", styConfig.link.strokeColor)
               .attr("stroke-width", styConfig.link.strokeWidth)
               .attr("opacity", styConfig.link.defaultOpacity)
               .attr('dir', function(d) {return d.dir})
               .attr('nodeID', function(d) { return d.target })
               .classed('link',true).merge(link)

    //labels
    label = simConfig.labels.selectAll('.label')
                           .data(graphNodes, function(d) {return d.title})
                           .attr('fill-opacity',styConfig.nodeLabel.defaultOpacity)
                           .order()
                           .classed('mainArticleLabel', function(d,i) {return i===0?true:false})
                           .attr("fill", function(d) {return color(d.primary_domain)})
    label.exit().remove();

    label = label.enter()
                 .append("text")
                 .text(function(d) {return d.title})
                 .attr('fill-opacity',styConfig.nodeLabel.defaultOpacity)
                 .attr("fill", function(d) {return color(d.primary_domain)})
                 .attr('nodeID', function(d) {return d.id})
                 .classed('label',true)
                 .classed('mainArticleLabel', function(d,i) {return i===0?true:false})
                 .merge(label)

    label
        .on('mouseover', function() {mouseOverArticleNode(this, data,'fill-opacity')})
        .on('mouseout', function() {mouseOutArticleNode(this, data)})
        .on('click', function()  { sngClickArticleNode(this, data, 'fill-opacity')})
        .on('dblclick', function() {dblClickArticleNode(this, 'fill-opacity')})


    //nodes
    node = simConfig.nodes.selectAll('.node')
                         .data(graphNodes, function (d) {return d.id})
                         .order()
                         .attr("r", styConfig.nodeLabel.defaultRadius)
                         .attr("fill", function(d) {return color(d.primary_domain)})
                         .classed('mainArticleNode', function(d,i) {return i===0?true:false})
    
    node.exit().remove()

    node = node.enter()
                .append('circle')
                .attr("r", styConfig.nodeLabel.defaultRadius)
                .attr("fill", function(d) {return color(d.primary_domain)})
                .attr("stroke", styConfig.nodeLabel.strokeColor)
                .attr("stroke-width", styConfig.nodeLabel.strokeWidth)
                .attr('nodeID', function(d) {return d.id})
                .style('opacity',styConfig.nodeLabel.defaultOpacity)
                .classed('node',true)
                .classed('mainArticleNode', function(d,i) {return i===0?true:false})
                .merge(node)
    node
        .on('mouseover', function() {mouseOverArticleNode(this, data, 'opacity')})
        .on('mouseout', function()  {mouseOutArticleNode(this, data)})
        .on('click', function()  { sngClickArticleNode(this, data, 'opacity')})
        .on('dblclick', function()  {dblClickArticleNode(this, 'opacity')})

    //update simulation ticker
    let numTicks = 0;
    simConfig.simulation
        .on('tick', function (){

            if (numTicks < 300 ) {

                link
                    .attr("x1", function(d) {return 0 })
                    .attr("y1", function(d) {return 0 })
                    .attr("x2", function(d) {return d.target.x })
                    .attr("y2", function(d) {return d.target.y })
                    .attr("linkIndex", function(d,i) { 
                        j=i+1;
                        linkAngles[j] = angle(0,0,d.target.x,d.target.y);
                        return i })

                node
                    .attr("cx", function(d) {return d.index === 0 ? 0: d.x })
                    .attr("cy", function(d) {return d.index === 0 ? 0: d.y });

                label
                    .attr('x', function(d) {return d.index === 0 ? 0: setArticleXpos(d.x,this.getBBox().width) })
                    .attr('y', function(d) {return d.index === 0 ? -10: d.y+4})
                    .attr("transform", function(d,i){ return i===0 ?`rotate(0)`:rotateLabel(i,d.x, d.y)})
            }   else {
                simConfig.simulation.stop();
            }   
            numTicks++;
        })
 
    //update simulations

    simConfig.simulation.force("charge")
        .strength(function() { return forceStrength(countOfNodes)})

    simConfig.simulation.force("link")
        .id(function (d) {return d.id})
        .distance(225)
        .links(graphLinks)
    simConfig.simulation.force("forceX").strength(0)
    simConfig.simulation.force("forceY").strength(0)
    simConfig.simulation.force("collide").radius(3)
    simConfig.simulation.nodes(graphNodes)
    simConfig.simulation.alpha(1).restart();

    setArticleGraphMainLabel()



}

function setArticleGraphMainLabel() {
        //style main article node   

        let mainArticleTitle = d3.select('.mainArticleLabel').datum()
        let currentMainArticleNode = [{'text': mainArticleTitle.title, 'primaryDomain': mainArticleTitle.primary_domain}]
        

        let mainArticleLabelArea = simConfig.labels.append('g')
            .classed('mainArticleLabelArea', true)

        mainArticleLabelArea.html('')

        mainArticleLabelArea
            .style('display', 'block')


    new d3plus.TextBox()
        .data(currentMainArticleNode)
        .select('.mainArticleLabelArea')
        .y(-15)
        .x(-100)
        .fontFamily('proxima-nova, sans-serif')
        .fontSize(18)
        .fontColor(function(d) {return color(d.primaryDomain)})
        .verticalAlign('top')
        .textAnchor('middle')
        .width(200)
        .lineHeight(20)
        .height(150)
        .render();

        d3.select('.d3plus-textBox').style('opacity',1)

}

// ****** ARTICLE GRAPH SIDEBAR  ****** 

function clearSidebar(sidebarToClear) {
    sidebarToClear.html("")
    // sidebarToClear.style("display", "block")
}
function updateSidebarsArticle(data, selectedArticle) {
    updateSideBarLeft_ArticleMain(selectedArticle, 'Main')
    updateSideBarRight_ArticleMain(data, selectedArticle)

}

function updateSideBarLeft_ArticleMain(selectedArticle, titleType){

    if(selectedArticle) {

        clearSidebar(sidebarLeft)

        let sideBarLeftContent = sidebarLeft.append("div");

        setArticleIntroParagraph(sideBarLeftContent, titleType, selectedArticle);
        setArticleDomainDetails(sideBarLeftContent, selectedArticle);

    }
}

//presently not used, but possibly will be in the future
function updateSideBarLeft_ArticlePreview(selectedArticle, relatedArticles) {
    if(selectedArticle) {

        clearSidebar(sidebarLeft)

        let sideBarLeftContent = sidebarLeft.append("div");

        setArticleIntroParagraph(sideBarLeftContent, "Preview", selectedArticle);
        setArticleDomainDetails(sideBarLeftContent, selectedArticle);
        setArticleRelatedLinks(sideBarLeftContent, selectedArticle, relatedArticles);
    }

}

function setArticleIntroParagraph(parentSidebar, titleType, selectedArticle) {

    let introParagraphPanel = parentSidebar.append("div")
    introParagraphPanel
        .classed('panelBG', true)
        .attr('id','articleIntroParagraphPanel')
        .style('opacity',0.25)
        .style('display', 'none')

    introParagraphPanel
        .transition().duration(500)
            .ease(d3.easeLinear)
            .style('opacity',panelOpacityValue)
            .style('display', 'block')


    
    let titleDisplay = selectedArticle.title

    // if (titleType === 'Main') { titleDisplay = selectedArticle.title + ' (Main)' }
    // if (titleType === 'Preview') {titleDisplay = selectedArticle.title + ' (Preview)' }
    // if (titleType === 'Explore') {titleDisplay = selectedArticle.title + ' (Explore)' }y

    introParagraphPanel.append("h2")
        .text(titleDisplay)
        .classed('panelHeading', true)
        .style('font-size', 'bigger')
        .style('color', function() {return color(selectedArticle.primary_domain)})

    let articleIntroParagraphContentArea = introParagraphPanel.append('div')
        .attr('id', 'articleIntroParagraphContentArea')
        .style('display', 'block')


    let paragraphData = getParagraphDataHTML(selectedArticle.preamble_text,600);
   
    let paragraphDiv = articleIntroParagraphContentArea.append('div')
        .html(paragraphData)
        .classed('panelParagraphText', true)

    let articleDetailsArea = articleIntroParagraphContentArea.append('div')
        .classed('calloutBG', true)
        .classed('articleDetailsBG', true)
        .classed('introParagraphText', true)
        .text('Article Details')

    setArticleDetailsPage(selectedArticle) 
    
    articleDetailsArea
            .on('mouseover', function() {activateItemLink(this)})
            .on('mouseout', function() {deActivateItemLink(this)})
            // .on('click', function() { toggleHelpPage('#articleDetails')})
            .on('click', function() { toggleArtileDetailsPage() })

}

function showArticleDetailsPage() {
    dimScreen('details');
    panelOpacityValue=0.25;

    articleDetailsPage    
        .transition().duration(pageTransition)
            .style('display','block')
            .style('opacity',1)

}
function hideArticleDetailsPage() {
    articleDetailsPage
        .transition().duration(pageTransition)
        .style('opacity',0)
        .style('display','none')
    
    panelOpacityValue=1;
    resetScreen();
}
function toggleArtileDetailsPage() {
    
    if(articleDetailsPage.style('display')==='block') {
        hideArticleDetailsPage();
    }   else    {
        showArticleDetailsPage();
    }
}
function setArticleDetailsPage(selectedArticle) {

    if(!isNavFullOpacity()) {dimScreen('details')}

    articleDetailsPage.html('')

    let articleDetailsContentArea = articleDetailsPage.append('div')

    let articleDetailsHeadeding = articleDetailsContentArea.append("h2")
        .text(selectedArticle.title)
        .classed('panelHeading', true)
        .classed('instructionsPageHeading',true)
        .style('color', function() {return color(selectedArticle.primary_domain)})

    //details table
    let sepURL = baseURL + selectedArticle.id
    let detailsData = [
            `<td>Author(s):</td><td>${selectedArticle.author}</td>`,
            `<td>Pub&nbsp;Date:</td><td> ${selectedArticle.pubdate.replace(/;/g,';<br>')}</td>`,
            `<td>Word&nbsp;Count:</td><td> ${selectedArticle.word_count}</td>`,
            `<td>SEP Link:</td><td><a href="${sepURL}" target="_blank">${selectedArticle.title}</a></td>`
        ]
    
    let detailsAndTocDiv = articleDetailsContentArea.append('div')
        .attr('id','detailsAndTOCDiv')

    let detailsTableHeading = detailsAndTocDiv.append("h2")
        .text('Article Details')
        .style('color', function() {return color(selectedArticle.primary_domain)})

    let detailsTableDiv = detailsAndTocDiv.append('div')
        .classed('articleDetailsTableDiv', true)


    let detailsTable = detailsTableDiv.append('table')
            .classed('table', true)
            .classed('table-sm', true)
            .classed('table-bordered',true)
            .classed('table-hover', true)
            .classed('table-dark', true)
            .classed('table-hover', true)
            .style('margin','0')
            .style('padding','0')
    
    detailsTable.append('tbody')
    
    detailsTable.selectAll('tr')
            .data(detailsData)
            .enter().append('tr')
                .html((d) => d)
                .classed('panelListItem', true)
                .style('margin','0')
                .style('padding','0')
                .style('text-indent', '0')

    // TOC area
    let exploreTOCContentArea = detailsAndTocDiv.append("div")
    .attr('id','exploreTOCContentArea')

    let exploreTOCHeading = exploreTOCContentArea.append('h2')
        .text('Table of Contents')
        .style('color', function() {return color(selectedArticle.primary_domain)})

    exploreTOCContentArea.append('p')
        .text('(Links to SEP article sections)')
        .style('font-size', 'smaller')
        .style('margin-top', '-.5em')

    let toc_html_original = selectedArticle.toc
    let toc_html_updated = toc_html_original.replace(/#/g, `${sepURL}#`)
                                            .replace(/<a/g, '<a target="_blank" ')

    let tocArea = exploreTOCContentArea.append('div')
        .html(toc_html_updated)
        .attr('id','tocArea')

    d3.select("#toc")
        .classed('scrollbars', true)
    
    // main text area
    let preamableArea = articleDetailsContentArea.append("div")
    let paragraphData = getParagraphDataHTML(selectedArticle.preamble_text,2000)
    preamableArea
        .html(paragraphData)
        .attr('id', 'preambleArea')
        .classed('panelParagraphText', true)
        .classed('scrollbars', true)
        .style('line-height', '1.2')

    // footer area - close page div
    let closePageDiv = articleDetailsContentArea.append('div')
        .text('Close Page')
        .classed('closePageArea',true)
        .classed('graphModeHelpCallout', true)

    let articleDetailTip = articleDetailsContentArea.append('div')
        .html('Update article details by <strong>mousing-over</strong> the article titles in the Right Sidebar.')
        .attr('id', 'articleDetailsTip')



    d3.selectAll('.instructionsPageHeading')
        .on('mouseover', function() {activateItemLink(this)})
        .on('mouseout', function() {deActivateItemLink(this)})
        .on('click', function() { hideArticleDetailsPage(); })

    d3.selectAll('.closePageArea')
        .on('mouseover', function() {activateItemLink(this)})
        .on('mouseout', function() {deActivateItemLink(this)})
        .on('click', function() { hideArticleDetailsPage(); })



}
function getParagraphDataHTML(paragraphDataFromNode, substringLength) {
    let htmlReturn = '';
    //only display the first 500 characters of the node's intro paragraph
    if(typeof(paragraphDataFromNode)!=='undefined') {
        if(paragraphDataFromNode !== '') {
            if (paragraphDataFromNode.length > substringLength ) {
                let paragraphSubstring = paragraphDataFromNode.substring(0,substringLength)

                let lastPeriod = paragraphSubstring.lastIndexOf('.') 
                let lastQuestionMark = paragraphSubstring.lastIndexOf('?')
                let lastComma = paragraphSubstring.lastIndexOf(',')
                let lastSemiColon = paragraphSubstring.lastIndexOf(';')
                let lastPuncMark = Math.max(lastPeriod, lastQuestionMark, lastComma, lastSemiColon)

                if(lastPeriod !== -1) {
                    if(lastPeriod > lastQuestionMark) { finalParaText = paragraphSubstring.substring(0,lastPeriod+1) }
                    if(lastPeriod < lastQuestionMark) { finalParaText = paragraphSubstring.substring(0,lastQuestionMark+1) }
                } else {
                    finalParaText = paragraphSubstring.substring(0,lastPuncMark) + ' ...'
                }
                
                if(substringLength===2000) {
                    htmlReturn = '<p>' + finalParaText + '</p><p class="panelDispayCut">~ Abstract Shortened For Display ~</p>' 
                }   else {
                    htmlReturn = '<p>' + finalParaText + '</p>' 
                }
                

                // less than 500 characters
            }  else {
                htmlReturn = '<p>' + paragraphDataFromNode + '</p>'
            }
        }
    }   else    {
        htmlReturn = ''
    }
    
    return htmlReturn

}

function setArticleDomainDetails(parentSidebar, selectedArticle) {
    let domainListDiv = parentSidebar.append("div")
        .classed('panelBG', true)
        .attr('id','articleDomainDetailsPanel')

    // get domain list from selectedArticle, and then clean process it for display
    let primaryDomain = selectedArticle.primary_domain
    let domainDataDetails = selectedArticle.domain_tags.split(',')
    let pdPosition = domainDataDetails.indexOf(primaryDomain)
    domainDataDetails.splice(pdPosition,1)
    domainDataDetails.sort((a,b) => d3.ascending(a, b))
    domainDataDetails.unshift(primaryDomain)

    let domainDataRows = [];

    domainDataDetails.forEach(function(node, i)  {
        let domainColor = color(node)
        let domainTypeText;
        let domainText = `<td style="color:${domainColor}"><span class="domainItem">${node}</span></td>`
        
        if(i===0) {  domainTypeText = `<td class="domainTypeText">Primary&nbsp;Domain:</td>` }
        if(i===1) {  domainTypeText = `<td class="domainTypeText">Other&nbsp;Domain(s):</td>` }
        if(i>1)   {  domainTypeText = `<td class="domainTypeText"></td>`  }

        domainDataRows.push(domainTypeText + domainText)
    })

    let panelHeading;
    if(domainDataRows.length === 1 ) { 
        panelHeading = 'Article Domain' }   
    else    {
        panelHeading = "Article Domains"
    }

    let domainListHeading = domainListDiv.append("h2")
        .text(panelHeading)
        .attr('id', 'domainListHeading')
        .classed('panelHeading', true)

    let domainListContentArea = domainListDiv.append('div')
        .attr('id','domainListContentArea')
        .style('display', 'block')

    let domainTable = domainListContentArea.append('table')
        .classed('table', true)
        .classed('table-sm', true)
        .classed('table-borderless',true)
        .classed('detailsTable', true)
        .style('margin-left', '.5em')
        .style('padding-right', '1em')
   

    let domainTbody = domainTable.append('tbody')

    domainTbody.selectAll('tr')
        .data(domainDataRows)
        .enter().append('tr')
            .html((d) => d)
            .style('margin','0')
            .style('padding','0')
            .exit().remove()

    let articleDomainsHelp = setPanelHelp(domainListContentArea, 'Article Domains Help', 'panelHelpLeftSideBar', '#articleDomainsHelp')

    articleDomainsHelp
        .on('mouseover', function() {activateItemLink(this)})
        .on('mouseout', function() {deActivateItemLink(this)})
        .on('click', function() { 
            toggleHelpPage('#graphHelpArticleDomains')
        })

    let domainItems = d3.selectAll('.domainItem')
    domainItems
        .on('mouseover', function() { activateItemLink(this)})
        .on('mouseout', function() { deActivateItemLink(this)})
        .on('click', function () {
            let domainTitle = d3.select(this).node().innerHTML
            showDomainGraph(domainTitle)
    })

}

function toggleArticleIntroContent(state) {
    let articleIntroContentArea = d3.select('#articleIntroParagraphContentArea')

    if(state === 'on') {
        articleIntroContentArea.style('display', 'block')
    }   else  if (state === 'off')   {
        articleIntroContentArea.style('display', 'none')
    }

    window.getSelection().removeAllRanges();

}

function toggleDomainDetailsContent(state) {
    let domainDetailsContentArea = d3.select('#domainListContentArea')
    let domainDetailsHeading = d3.select('#domainListHeading')
    if(state === 'on') {
        domainDetailsContentArea.style('display', 'block')
    }   else  if (state === 'off')   {
        domainDetailsContentArea.style('display', 'none')
    }

    window.getSelection().removeAllRanges();

}



function setExploreTOC(parentSidebar, selectedArticle) {
    let exploreTOCDiv = parentSidebar.append("div")
        .classed('panelBG', true)

    let exploreTOCHeading = exploreTOCDiv.append('h2')
        .text('Explore the TOC')
        .attr('id','exploreTOCHeading')
        .classed('panelHeading', true)
        .classed('toggleOffBG_User', true)
  
    exploreTOCContentArea = exploreTOCDiv.append('div')
        .style('display', 'none')
        .attr('id','exploreTOCContentArea')
        .classed('scrollbars', true)

    exploreTOCContentArea.append('p')
        .text('(Links to SEP article sections)')
        .classed('panelDispayCut', true)
        .classed('float-right', true)
        .style('margin-top','-.5em')
        .style('margin-left', '-1em')


    let sepURL = baseURL + selectedArticle.id
    
    let toc_html_original = selectedArticle.toc
    let toc_html_updated = toc_html_original.replace(/#/g, `${sepURL}#`)
                                            .replace(/<a/g, '<a target="_blank" ')
    exploreTOCContentArea.append('div')
        .html(toc_html_updated)
        .classed('panelListItem', true)
        .style('margin-top', '-1.5')

    exploreTOCHeading
        .on('mouseover', function() { activateItemLink(this)})
        .on('mouseout', function() { deActivateItemLink(this)})
        .on('click', function() {
            let currentState = exploreTOCContentArea.style('display')

            if(currentState === 'block') {
                toggleExploreTOCArea('off')
                toggleDomainDetailsContent('on');
                toggleArticleDetailsContent('on');
            }   else if(currentState === 'none')   {
                toggleExploreTOCArea('on')
                toggleDomainDetailsContent('off');
                toggleArticleDetailsContent('off');
            } 
        })
}


// deprecated 
function setArticleRelatedLinks(parentSidebar, selectedArticle, relatedArticles) {
    let relatedLinksDiv = parentSidebar.append("div")

    if (typeof(relatedArticles) !== "undefined") {
            relatedLinksDiv.html("")
            relatedLinksDiv.classed('panelBG', true);
            let numRelated = (relatedArticles.length > 1) ?  relatedArticles.length - 1 : 0;
            let numRelatedText = (numRelated===1) ? 'Shared Link with' : 'Shared Links with' 
            let relatedLinksParagraph = relatedLinksDiv.append("p")
                .style('padding', '.5em 0')

            relatedLinksParagraph.append("span")
                .html(`<span class="badge badge-pill badge-light">${numRelated}</span>  ${numRelatedText}`)
                .style('color', 'white')
                .classed('linksSharedText', true)
            
            relatedLinksParagraph.append('span')
                .html(`${graphNodes[0].title}`)   
                .style('color', function() { return color(graphNodes[0].primary_domain)})
                .classed('linksSharedText', true)

     }  else {
        relatedLinksDiv.html("")
     } 
}

function updateSideBarRight_ArticleMain(data, selectedArticle){
    if(selectedArticle) {

        let articleData = getArticleData(data,selectedArticle.title);

        clearSidebar(sidebarRight);

        let sidebarRightContent = sidebarRight.append("div");

        setLinkCountPanel(sidebarRightContent,articleData, data);
        setArticleListPanel(sidebarRightContent,articleData, data)
        setLinkDomainPanel(sidebarRightContent, articleData);
        setLinkDirectionPanel(sidebarRightContent, articleData);        
    }
}

function setLinkCountPanel(parentSidebar, articleData, data) {

    let linkCountDiv = parentSidebar.append("div")
        .classed("panelBG", true)  
        .classed("linkCountDiv", true)

    linkCountDiv.append("h2")
        .html(`<span class="badge badge-pill badge-light">${articleData.links.length}</span> Linked Articles`)
        .classed('linkCountText', true)

}

function setArticleListPanel(parentSidebar, articleData, data) {
   // build list of articles 
   let articleListDiv = parentSidebar.append("div")
    .classed('panelBG', true)
    .attr('id','articleListOfAllArticlesPanel')

   let articleListHeading = articleListDiv.append("h2")
    .text("List of Articles")
    .attr('id', 'articleListHeading')
    .classed('panelHeading', true)
    .classed('toggleOffBG_User', true)

    articleListDiv.append('p')
        .text('')
        .style('display', 'block')
        .attr('id', 'articleHiddenMessage')
        .classed('panelParagraphText', true)

   let articleListContentArea = articleListDiv.append("div")
       .attr("id", "articleListContentArea")
       .classed('scrollbars', true)
       .style("display", "none")

   let articleNodesCleaned = [] 
   articleData.nodes.forEach(node=> {
       if (node.index !== 0 ) {articleNodesCleaned.push(node)}
   })
   articleNodesCleaned.sort((a,b) => d3.ascending(a.title, b.title))

   articleListContentArea.append("ul")
       .selectAll(".linkArticlesListItem")
       .data(articleNodesCleaned)
       .enter()
           .append("li")
           .html(function(d) {return `${d.title}`})
           .style("color", function(d) {return color(d.primary_domain)})
           .classed('linkArticlesListItem', true)
           .classed('panelListItem', true)
       .exit().remove()

    let listOfArticlesHelp = setPanelHelp(articleListDiv, 'List of Articles Help', 'panelHelpRightSideBar', '#listOfArticlesHelp')

    listOfArticlesHelp
        .on('mouseover', function() {activateItemLink(this)})
        .on('mouseout', function() {deActivateItemLink(this)})
        .on('click', function() { toggleHelpPage('#graphHelpListOfArticles')})

   // setup UI interactions
   let listArticleLinks = d3.selectAll('.linkArticlesListItem');
   let centralNode = graphNodes[0];

   listArticleLinks
        .on('mouseover', function() { mouseOverArticleNode(this, data, 'opacity')})
        .on('mouseout', function()  {  mouseOutArticleNode(this, data)})
        .on('click', function()  { if(isNavFullOpacity()) { sngClickArticleNode(this, data, 'opacity')}})
        .on('dblclick', function()  { if(isNavFullOpacity()) { dblClickArticleNode(this, 'opacity')}})

    articleListHeading
       .on('mouseover', function() { activateItemLink(this) })
       .on('mouseout', function()  { deActivateItemLink(this) })
       .on('click', function()  {
        let currentState = articleListContentArea.style('display')

        if(currentState === 'block') {
            toggleArticleListContent('off')
            toggleLinkDirectionContent('on')
            toggleLinkDomainContent('on')
        }   else if(currentState === 'none')   {
            toggleArticleListContent('on')
            toggleLinkDirectionContent('off')
            toggleLinkDomainContent('off')
        } 
           
    })
}

function toggleArticleListContent(state) {
    let articleListHeading = d3.select("#articleListHeading")
    let articleListContentArea = d3.select("#articleListContentArea")
    let articleHiddenMsg = d3.select('#articleHiddenMessage')

    if (state==='on') {
        articleListContentArea.transition().duration(200).style('display', 'block')
        articleHiddenMsg.transition().duration(200).style('display', 'none')

        articleListHeading
            .classed('toggleOnBG_User', true)
            .classed('toggleOffBG_User', false)
    }   else if(state==='off') {
        articleListContentArea.transition().duration(200).style('display', 'none')
        articleHiddenMsg.transition().duration(200).style('display', 'block')

        articleListHeading
            .classed('toggleOnBG_User', false)
            .classed('toggleOffBG_User', true)
    }

    window.getSelection().removeAllRanges();
}

function setLinkDirectionPanel(parentDiv, articleData) {

    let linkDirectionPanel = parentDiv.append("div")
        .classed('panelBG', true)
        .attr('id','articleLinkDirectionsPanel')

    let linkDirectionHeading = linkDirectionPanel.append("h2")
        .text("Link Directions")
        .attr('id', 'linkDirectionHeading')
        .classed('panelHeading', true)

    let linkDirectionContentArea =  linkDirectionPanel.append("div")
        .attr("id", "linkDirectionContentArea")
        .attr("display", "block")

    linkItems = [`<span class="badge badge-pill badge-light badge-adjust">${articleData.biLinks.size}</span> Bi-Directional Links`,
                `<span class="badge badge-pill badge-light badge-adjust">${articleData.inLinks.size}</span> In-Coming Links`,
                `<span class="badge badge-pill badge-light badge-adjust">${articleData.outLinks.size}</span> Out-Going Links`]

    linkDirectionContentArea.append("ul")
        .selectAll(".linkDirListItem")
        .data(linkItems)
        .enter()
        .append('li')
        .html(function(d) {return d})
        .classed('linkDirListItem', true)
        .classed('panelListItem_numbered', true)
    .exit().remove()

    let linkDirectionsHelp = setPanelHelp(linkDirectionContentArea, 'Link Directions Help', 'panelHelpRightSideBar', '#linkDirectionHelp')

    linkDirectionsHelp
        .on('mouseover', function() {activateItemLink(this)})
        .on('mouseout', function() {deActivateItemLink(this)})
        .on('click', function() { toggleHelpPage('#graphHelpLinkDirections')})

    let listLinkDirection = d3.selectAll('.linkDirListItem')

    listLinkDirection
        .on('mouseover', function() {
            activateItemLink(this)
            
            if(!exploreMode) { 
                activateLinkDirDomItem('.linkDirListItem',this, 'normal');
                displayLinkDirectionArticles(this, articleData) }
        })
        .on('mouseout', function() {
            deActivateItemLink(this)
            if(!exploreMode) {resetDisplayDefaultsArticleGraph();}
        })

        .on('click', function() {
            activateItemLink(this)
            if (d3.select(this).style('font-weight') === 'bold' ) {
                resetDisplayDefaultsArticleGraph();
                setGraphMode('Hover')
            } else {
                displayLinkDirectionArticles(this, articleData)
                activateLinkDirDomItem('.linkDirListItem',this, 'bold')
                activateLinkDirDomItem('.linkDomainListItem',this, 'normal')
                setGraphMode('Click')
            }

        })

}

function activateLinkDirDomItem(itemClass, mouseReference, fontWeight) {

    d3.selectAll(itemClass).each(function (d,i) {
        if(mouseReference === this) {
            d3.select(this)
                .style('font-weight', fontWeight)
                .transition().duration(200).style('opacity', styConfig.listItems.defaultOpacity)
        }   else    {
            d3.select(this)
                .style('font-weight', 'normal')
                .transition().duration(200).style('opacity', styConfig.listItems.dimmedOpacity)
        }
    })
}


function displayLinkDirectionArticles(mouseReference, articleData){
    let linkDirectionHTML = d3.select(mouseReference).datum()
    let startPos = linkDirectionHTML.lastIndexOf('</span>') + 7
    let linkDirectionFinal = linkDirectionHTML.trim().substring(startPos,startPos+3).trim()
    switch(linkDirectionFinal) {
        case 'Bi':
            focusOnLinkAnalysis(Array.from(articleData.biLinks))
            break;
        case 'In':
            focusOnLinkAnalysis(Array.from(articleData.inLinks))
            break;
        case 'Ou':
            focusOnLinkAnalysis(Array.from(articleData.outLinks))
            break;
    }
}

function toggleLinkDirectionContent(state) {
    let linkDirectionHeading = d3.select("#linkDirectionHeading")
    let linkDirectionContentArea = d3.select("#linkDirectionContentArea")

    if (state==='on') {
        linkDirectionContentArea.style('display', 'block')
    }   else if(state==='off') {
        linkDirectionContentArea.style('display', 'none')
    }

    window.getSelection().removeAllRanges();

}

function setLinkDomainPanel(parentSidebar, articleData) {
    // build domain links data 
    let linkDomainPanel = parentSidebar.append('div')
        .classed('panelBG', true)
        .attr('id','articleLinkDomainsPanel')

    let linkDomainHeading = linkDomainPanel.append('h2')
        .text('Link Domains')
        .attr('id', 'linkDomainHeading')
        .classed('panelHeading', true)

    let linkDomainContentArea = linkDomainPanel.append('div')
        .attr('id', "linkDomainContentArea")
        .attr("display", "block")
        .classed('scrollbars',true)
    
    linkDomainContentArea.append("ul")
        .selectAll(".linkDomainListItem")
        .data(articleData.linkDomains)
        .enter()
        .append('li')
        .html(function(d) {return `<span class="badge badge-pill badge-light">${d[1]}</span>  ${d[0]}`})
        .style("color", function(d) {return color(d[0])})
        .classed('linkDomainListItem', true)
        .classed('panelListItem_numbered', true)
        .exit().remove()

    let linkDomainHelp = setPanelHelp(linkDomainPanel, 'Link Domain Help', 'panelHelpRightSideBar', '#linkDomainHelp')

    linkDomainHelp
        .on('mouseover', function() {activateItemLink(this)})
        .on('mouseout', function() {deActivateItemLink(this)})
        .on('click', function() { toggleHelpPage('#graphHelpLinkDomains')})
    
    let listlinkDomains = d3.selectAll('.linkDomainListItem')
    listlinkDomains
        .on('mouseover', function() {
            activateItemLink(this)
            let linkDomainArray = getDomainLinksInArticle(d3.select(this).datum())
            if(!exploreMode) { 
                activateLinkDirDomItem('.linkDomainListItem',this,'normal');
                focusOnLinkAnalysis(linkDomainArray) }
            
        })
        .on('mouseout', function() {
            deActivateItemLink(this);
            if(!exploreMode) { resetDisplayDefaultsArticleGraph(); }
        })
        .on('click', function() {
            activateItemLink(this)
            if (d3.select(this).style('font-weight') === 'bold' ) {
                resetDisplayDefaultsArticleGraph();
                setGraphMode('Hover')
            } else {
                let linkDomainArray = getDomainLinksInArticle(d3.select(this).datum())
                focusOnLinkAnalysis(linkDomainArray) 
                activateLinkDirDomItem('.linkDirListItem',this, 'normal')
                activateLinkDirDomItem('.linkDomainListItem',this,'bold')
                setGraphMode('Click')
            }
            
        })
}

function toggleLinkDomainContent(state) {
    
    let linkDomainHeading = d3.select('#linkDomainHeading')
    let linkDomainContentArea = d3.select('#linkDomainContentArea')

    if (state==='on') {
        linkDomainContentArea.transition().duration(200).style('display', 'block')
        linkDomainHeading
            // .classed('toggleOnBG', true)
            // .classed('toggleOffBG', false)
    }   else if(state==='off') {
        linkDomainContentArea.transition().duration(200).style('display', 'none')
        linkDomainHeading
            // .classed('toggleOnBG', false)
            // .classed('toggleOffBG', true)
    }

    window.getSelection().removeAllRanges();

}

function setPanelHelp(contentArea, altText, sidebarClass, divID) {
    
    let html = `<a><img src="/static/bootstrap-icons/question-circle.svg" alt="${altText}" class="panelHelpImg"></a>`
    let helpPanel = contentArea.append('p')
        .classed('calloutBG', true)
        .classed('panelHelp', true)
        .classed('panelHelpBGImage',true)
        .classed(sidebarClass, true)
        .attr('id', divID)
        // .html(html)

    return helpPanel

}
function activateItemLink(mouseReference, fontWeight) {
    d3.select(mouseReference)
        .style('cursor', 'pointer')
    
    if (typeof(fontWeight)!=='undefined') {    d3.select(mouseReference).style('font-weight', fontWeight)}

}
function deActivateItemLink(mouseReference, fontWeight) {
    d3.select(mouseReference)
        .style('cursor', 'normal')

    if (typeof(fontWeight)!=='undefined') {    d3.select(mouseReference).style('font-weight', fontWeight)}
}
function getDomainLinksInArticle(linkDomain) {
    let domainArray = []
    graphNodes.filter(node => {
        if (node.primary_domain === linkDomain[0]) { domainArray.push(node.id)}
    })
    return domainArray
}
function setClickTargetActive(elementID) {

    let graphLabel = d3.selectAll('.label').filter(function(d,i) {return d.id===elementID})
    let listTitle = d3.selectAll('.linkArticlesListItem').filter(function(d,i) {return d.id===elementID})

    graphLabel.transition().duration(200)
        .style('font-weight', 'bold')
        .attr('fill-opacity', styConfig.nodeLabel.defaultOpacity)

    listTitle.transition().duration(200)
        .style('font-weight', 'bold')
        .style('opacity', styConfig.listItems.defaultOpacity)


}
function dblClickArticleNode(dblClickReference, opacityTest) {
    
    // get node or label activated
    let activeElement = d3.select(dblClickReference)

   //test if nodes are active or if they're hidden
   if(activeElement.style(opacityTest) > styConfig.nodeLabel.notInArrayOpacity) {

        if (activeElement.datum().index !== 0) {
        // do the following if the activated node or label was not the central node

            activeElement.style('cursor', 'pointer'); 
            resetDisplayDefaultsArticleGraph();
            let articleTitle = activeElement.datum().title
            showArticleGraph(articleTitle)
        }
   }

   window.getSelection().removeAllRanges();
}

function sngClickArticleNode(sngClickReference, data, opacityTest) {
    // get node or label activated
    let activeElement = d3.select(sngClickReference)
    
    //test if nodes are active or if they're hidden
    if(activeElement.style(opacityTest) > styConfig.nodeLabel.notInArrayOpacity) {
        
        //  if not central node
        if (activeElement.datum().index !== 0) {

            activateItemLink(sngClickReference)
            if(activeElement.style('font-weight') === 'normal') {
                let relatedArticles = getRelatedArticles(data,activeElement.datum())
                resetListItemDefaults('.linkArticlesListItem')
                resetListItemDefaults('.linkDomainListItem')
                resetListItemDefaults('.linkDirListItem')
                focusOnArticleNode(data, activeElement.datum())
                updateSideBarLeft_ArticleMain(activeElement.datum(), 'Explore')
                setClickTargetActive(activeElement.datum().id)
                setNavTip('On')
                setGraphMode('Click')
           }    else    {   
                activeElement.transition().duration(200).style('font-weight', 'normal')
                setGraphMode('Hover')
                setNavTip('Off')
           }
        }
    }

}

function mouseOverArticleNode(mouseOverReference, data, opacityTest) {
    
    // get node or label activated
    let activeElement = d3.select(mouseOverReference)
    if(opacityTest==='fill-opacity') {
        if(activeElement.style(opacityTest) > styConfig.nodeLabel.notInArrayOpacity) {
            if (activeElement.datum().index !== 0) {
                // do the following if the activated node or label was not the central node
                activateItemLink(mouseOverReference)
                // let relatedArticles = getRelatedArticles(data,activeElement.datum())
    
                if (!exploreMode) {  
                    focusOnArticleNode(data, activeElement.datum()) 
                    setNavTip('On')
                }
    
                updateSideBarLeft_ArticleMain(activeElement.datum(), 'Preview')
            }
        }
    }

    if(opacityTest==='opacity') {
        if(activeElement.style(opacityTest) > styConfig.listItems.dimmedOpacity) {
            if (activeElement.datum().index !== 0) {
                // do the following if the activated node or label was not the central node
                activateItemLink(mouseOverReference)
                // let relatedArticles = getRelatedArticles(data,activeElement.datum())
    
                if (!exploreMode) {  
                    focusOnArticleNode(data, activeElement.datum()) 
                    setNavTip('On')
                }
    
                updateSideBarLeft_ArticleMain(activeElement.datum(), 'Preview')
            }
        }
    }


}
function mouseOutArticleNode(mouseOverReference, data) {

    deActivateItemLink(mouseOverReference)

    let activeElement = d3.select(mouseOverReference)
    let centralNode = graphNodes[0]
    let frozenNode = d3.selectAll('.label').filter(function (d,i) {return d3.select(this).style('font-weight') === 'bold'})
    if (!exploreMode) {  
        resetDisplayDefaultsArticleGraph(); 
        updateSideBarLeft_ArticleMain(centralNode, 'Main')
    }   
    if (exploreMode) {
        if(frozenNode.data().length > 0) { updateSideBarLeft_ArticleMain(frozenNode.datum(), 'Preview') }
        if(frozenNode.data().length === 0) { updateSideBarLeft_ArticleMain(centralNode, 'Preview')}
    }


}

function getNodeCenter(activeElement) {
    let _selectedNode = d3.selectAll('.node')
        .filter(function(d,i) {return d.id === activeElement.id})
    return _selectedNode
}

function getRelatedArticles(data, activeElement) {

    // get article data and node ids for active Element
    let articleData = getArticleData(data, activeElement.title)
    let articleNodeIDs = articleData.nodes.map(node => node.id)

    // get node IDS for nodes in global graphNodes
    let graphNodesIDs = graphNodes.map(node => node.id)

    // get the set of related ids
    let relatedArticlesIDs = intersection(graphNodesIDs,articleNodeIDs)

    // populated relatedArticleNodes with nodes matched in the set of relatedArticlsIDS
    let relatedArticleNodes = []
    relatedArticlesIDs.forEach(relArticle=> {
        graphNodes.forEach(node => {
            if (node.index !== 0 && relArticle === node.id) {
                relatedArticleNodes.push(node)
            }
        })
    })

    relatedArticleNodes.sort( (a,b) => d3.ascending(a.title, b.title))

    return relatedArticleNodes
}

function focusOnArticleNode(data, activeElement) {

    let relatedArticles = getRelatedArticles(data,activeElement)

    let linkLinesGroup = simConfig.relatedLinks
    linkLinesGroup.html('')
    
    let startX = getNodeCenter(activeElement).attr('cx')
    let startY = getNodeCenter(activeElement).attr('cy')

    let linkLines = linkLinesGroup.selectAll('.relatedLinkLines')
        .data(relatedArticles)

    linkLines.exit().remove()
    linkLines = linkLines.enter()
                .append('line')
                .attr('x1', startX)
                .attr('y1', startY)
                .attr('x2', function (d) {return getNodeCenter(d).attr('cx')})
                .attr('y2', function (d) {return getNodeCenter(d).attr('cy')})
                .classed('relatedLinkLines', true)
                .style('stroke', function() {return color(activeElement.primary_domain)})
                .style('opacity', styConfig.linkLines.articleGraphOpacity)
                .merge(linkLines)



    let relatedArticleIDs = relatedArticles.map(article => article.id)

    // reduce opacity for all non-activated graph links, nodes, and labels
    d3.selectAll('.link')
        .each(function (d,i) {
            d3.select(this)
                .transition().duration(200).attr('opacity', function (link) { 
                    return link.target.id === activeElement.id ? styConfig.link.activeOpacity : styConfig.link.inactiveOpacity
                })
    });

    d3.selectAll('.label')
        .each(function (d,i) {
            d3.select(this)
                .transition().duration(200)
                    .attr('fill-opacity', function(label) { return setNodeLabelOpacity(label, relatedArticleIDs, activeElement)})
                    .style('font-weight', 'normal')
        })
        
    d3.selectAll('.node')
        .each(function (d,i) {
            d3.select(this)
            .transition().duration(200).style('opacity', function(node) { return setNodeLabelOpacity(node, relatedArticleIDs, activeElement)})
    })

    // reduce opacity for all non-activated list article titles
    d3.selectAll('.linkArticlesListItem')
        .each(function (d,i) {
            let articleRef = d3.select(this)

            if(relatedArticleIDs.includes(d.id) && d.id === activeElement.id) {
                articleRef
                .transition().duration(200)
                    .style('opacity', styConfig.listItems.defaultOpacity)
                    .style('font-weight', 'normal')

            }

            if(relatedArticleIDs.includes(d.id) && d.id !== activeElement.id) {
                articleRef
                .transition().duration(200)
                    .style('opacity', styConfig.listItems.defaultOpacity)
                    .style('font-weight', 'normal')
                    .style('list-style', 'none')
            }
            if(!relatedArticleIDs.includes(d.id)) {
                articleRef
                    .transition().duration(200)
                        .style('opacity', styConfig.listItems.dimmedOpacity)
                        .style('font-weight', 'normal')
                        .style('list-style', 'none')
            }
            
        })


}

function focusOnLinkAnalysis(linksReference) {
    if (linksReference.length > 0 ) {
        d3.selectAll('.link')
            .each(function (d,i) {
                let match = linksReference.includes(d.target.id)
                d3.select(this)
                    .transition().duration(200).attr('opacity', match ? styConfig.link.activeOpacity : styConfig.link.inactiveOpacity)
            })

    
        d3.selectAll('.label')
            .each(function (d,i) {
                d3.select(this)
                    .transition().duration(200).attr('fill-opacity', function(label) { return setNodeLabelOpacity(label, linksReference)})
            })

        d3.selectAll('.node')
            .each(function (d,i) {
                d3.select(this)
                    .transition().duration(200).style('opacity', function(node) { return setNodeLabelOpacity(node, linksReference)})
            })
        
        d3.selectAll('.linkArticlesListItem')
            .each(function (d,i) {
                let articleRef = d3.select(this)
                if(linksReference.includes(d.id)) { 
                    articleRef
                        .transition().duration(200).style('opacity', styConfig.listItems.defaultOpacity)
                }   else {
                    articleRef
                        .transition().duration(200).style('opacity', styConfig.listItems.dimmedOpacity)
                }
            })

        d3.selectAll('.relatedLinkLines')
            .transition().duration(100).style('opacity',styConfig.linkLines.inactiveOpacity)

        setNavTip('On')
    }

}

function setNodeLabelOpacity(selectedElement, elementsArray, activeElement) {
    let opacityValue;

    if (elementsArray.includes(selectedElement.id)) {opacityValue = styConfig.nodeLabel.inArrayOpacity}
    if (!elementsArray.includes(selectedElement.id)) {opacityValue = styConfig.nodeLabel.notInArrayOpacity}
    if (selectedElement.index === 0) {opacityValue = styConfig.nodeLabel.centralNodeDimmedOpacity}
    if (typeof(activeElement) !== 'undefined') {
        if (selectedElement.id === activeElement.id) { opacityValue = styConfig.nodeLabel.defaultOpacity}
    }

    return opacityValue

}
function setListItemBold(itemClass, mouseReference) {
    d3.selectAll(itemClass).each(function (d,i) {
        if(mouseReference === this) {
            d3.select(this)
                .style('font-weight', 'bold')
                .transition().duration(200).style('opacity', styConfig.listItems.defaultOpacity)
        }
    })
}

function resetListItemDefaults(itemClass) {
    d3.selectAll(itemClass)
        .transition().duration(200).style('opacity',styConfig.listItems.defaultOpacity)
        .style('font-weight', 'normal')
}
   

function resetDisplayDefaultsArticleGraph() {
    d3.selectAll('.link').transition().duration(200).attr('opacity', styConfig.link.defaultOpacity);
    d3.selectAll('.label').transition().duration(200)
        .attr('fill-opacity', styConfig.nodeLabel.defaultOpacity)
        .style('font-weight', 'normal')
    d3.selectAll('.node').transition().duration(200).style('opacity', styConfig.nodeLabel.defaultOpacity);
    d3.selectAll('.relatedLinkLines').transition().duration(200).style('opacity',styConfig.linkLines.inactiveOpacity)
    d3.select('.d3plus-textBox').transition().duration(200).style('opacity',styConfig.nodeLabel.defaultOpacity)

    resetListItemDefaults('.linkDirListItem')
    resetListItemDefaults('.linkDomainListItem')
    resetListItemDefaults('.linkArticlesListItem')

    setNavTip('Off')


} 

// ****** DOMAIN GRAPH FUNCTIONS ****** 

function showDomainGraph(domainTitle) {

    d3.json(json_file).then(function(data) {


        hidePage(homePageDiv);

        //get data from JSON and update globals
        let domainData = getDomainData(data,domainTitle)
        setGlobalNodesLinks(domainData)

        // setup graph to display article data

        showGraphPage();
        resetScreen()
        setGraphMode('Hover')
        setGraphType('Domain')

        //update graph 
        drawDomainSimulation(data, domainData)
        setPageTitle(domainTitle, domainTitle)
        updateSidebarLeft_DomainMain();
        updateSidebarRight_DomainMain(data, domainData);
        updateNeighborNodes();

        //update browser
        let domainURL = '/domain/' + domainData.id
        updateBrowser(domainURL,domainTitle)

        //set graph display defaults
        resetDisplayDefaultsArticleGraph();
        resetDisplayDefaultsDomainGraph();
        d3.selectAll('.label').remove();
        d3.select('.mainArticleLabelArea').remove();

        //update nav menu
        updateRecentSearch({'title': domainTitle, 'primary_domain': domainTitle},'Domain');
        showAll = false;

        //remove any selected page elements 
        window.getSelection().removeAllRanges();
    });
}

function getDomainData(data, domainTitle) {
    let domainData = {};
     let inCache = searchCache.find( ({domain}) => domain === domainTitle);

    if (!inCache) {
        domainData = getDomainDataFromJSON(data, domainTitle); 
    }   else    {
        domainData = inCache
    }

    return domainData
}

function getDomainDataFromJSON(data, domainTitle) {    


    // set URL id for domainTitle
    let domainID = domainTitle.toLowerCase().replace(/\s+/g,'-')

    // filter JSON for all the articles tagged in domainTitle
    let domainNodes = data.articles.nodes.filter(dnode => {
        return dnode.domain_tags.includes(domainTitle)
    })

    // get all source links for each article contained in domainNodes
    let sourceLinks = [];
    domainNodes.forEach(dnode => {
        data.articles.links.forEach(link => {
            if (dnode.id === link.source) {
                sourceLinks.push(link)
            }
        })
    })

   // select only those links in sourceLinks that have a target to one of the articles in domainNodes
   let domainLinks = [];
   domainNodes.forEach(dnode => {
        sourceLinks.forEach(slink => {
            if (dnode.id === slink.target) {
                domainLinks.push(slink)
            }
        })
    })

    // get count of number of domain links for each node 
    domainNodes.forEach(dnode => {

        let totalLinks = new Set();
        domainLinks.forEach(dlink => {
            if(dnode.id === dlink.source) {totalLinks.add(dlink.target)};
            if(dnode.id === dlink.target) {totalLinks.add(dlink.source)}
        })
        dnode["numLinks"] = totalLinks.size;
    })

    //store the domain data as an object to return to calling function
    let domainData = { "domain": domainTitle,
                       "id": domainID,
                        "nodes": domainNodes,
                        "links": domainLinks }

    // domainSearchCache.push(domainData)
    searchCache.push(domainData)

    return domainData

}

 
function drawDomainSimulation(data, domainData){

    let countOfNodes = graphNodes.length;

    //bind simulation link objects to the the data in graphLinks
    link = simConfig.links.selectAll('.link')
        .data(graphLinks, function(d) {return `${d.source}-${d.target}`});

    link.exit().remove();

    link = link.enter()
               .append('line')
               .attr("stroke", styConfig.link.strokeColor)
               .attr("stroke-width", styConfig.link.strokeWidth)
               .attr("opacity", styConfig.link.defaultOpacity)
               .classed('link',true).merge(link)

    //nodes

    let numLinksRange = graphNodes.map(node=>node.numLinks)
    let scaleNodeRadius = d3.scaleLinear()
        .domain([d3.min(numLinksRange), d3.max(numLinksRange)])
        .range([4,18])


    node = simConfig.nodes.selectAll('.node')
                         .data(graphNodes, function (d) {return d.id})
                         .attr("r", function(d) {return scaleNodeRadius(d.numLinks)})
                         .attr("fill", function(d) {return color(d.primary_domain)})
    
    node.exit().remove()

    node = node.enter()
                .append('circle')
                .attr("r", function(d) {return scaleNodeRadius(d.numLinks)})
                .attr("fill", function(d) {return color(d.primary_domain)})
                .attr("stroke", styConfig.nodeLabel.strokeColor)
                .attr("stroke-width",  styConfig.nodeLabel.strokeWidth)
                .attr('nodeID', function(d) {return d.id})
                .style('opacity',1)
                .classed('node',true)
                .merge(node)

    node.on('mouseover', function() {mouseOverDomainNode(this, data, domainData)})
    node.on('mouseout', function() {mouseOutDomainNode(this, data, domainData)})
    node.on('click', function() { sngClickDomainNode(this, data, domainData)})
    node.on('dblclick', function() {dblClickDomainNode(this, data)})    
    
    let numTicks = 0;
    simConfig.simulation
        .on('tick', function () {
            if (numTicks < 50 ) {

                link
                    .attr("x1", function(d) {return d.source.x })
                    .attr("y1", function(d) {return d.source.y })
                    .attr("x2", function(d) {return d.target.x})
                    .attr("y2", function(d) {return d.target.y})

                node
                    .attr("cx", function(d) {return d.x })
                    .attr("cy", function(d) {return d.y });

            }   else {
                simConfig.simulation.stop();
            }  
            numTicks++;
    })
    
    //restart simulation

    simConfig.simulation.force("charge")
        .strength(function() { return forceStrength(countOfNodes)})
    simConfig.simulation.force("link")
        .id(function (d) {return d.id})
        .distance(100)
        .links(graphLinks)
    simConfig.simulation.force("forceX").strength(function (d) { return (countOfNodes > 300) ? 0.15 : 0.05 })
    simConfig.simulation.force("forceY").strength(function (d) { return (countOfNodes > 300) ? 0.15 : 0.05 })
    simConfig.simulation.nodes(graphNodes);
    simConfig.simulation.force("collide").radius(15)
    simConfig.simulation.alpha(1).restart();

}

function setLinkDistanceDomain(countofNodes) {

}

function updateSidebarLeft_DomainMain(selectedDomainArticle){

        clearSidebar(sidebarLeft)

        let sideBarLeftContent = sidebarLeft.append("div")
        setDomainIntroPanel(sideBarLeftContent)
        if (typeof(selectedDomainArticle) !== 'undefined') {
            setArticleIntroParagraph(sideBarLeftContent,"Preview", selectedDomainArticle)
            setArticleDomainDetails(sideBarLeftContent,selectedDomainArticle)
            toggleDomainIntroContent('off')
        }

}

function updateSidebarRight_DomainMain(data, domainData) {
    
    clearSidebar(sidebarRight)

    let sidebarRightContent = sidebarRight.append("div")
    
    if (domainData) {

        setDomainCountPanel(sidebarRightContent, domainData, data);
        setCentralNodesPanel(sidebarRightContent, domainData, data)
        setDomainArticleListPanel(sidebarRightContent,domainData,data)
    }

}

function setDomainIntroPanel(parentSidebar) {

    let domainIntroPanel = parentSidebar.append("div")
        .classed('panelBG', true)
        .attr('id','domainIntroPanel')
        .style('margin-bottom', '2em')

    let domainTitle = pageTitle.text()
    let domainTitleText = `Domain Graph Introduction:<br>${domainTitle}`


    let domainIntroHeading = domainIntroPanel.append("h2")
        .html(domainTitleText)
        .attr('id', 'domainIntroHeading')
        .classed('panelHeading', true)
        .classed('toggleOnBG_User', true)
        .style('color', function() { return color(domainTitle) })


    let introText = '<p>The Domain Graph shows every article within this domain, and shows how they are all linked together.</p>' 
                    + '<p>When the graph is first loaded, only the nodes are visible; labels are activated by <strong>mousing-over</strong> or <strong>single-clicking</strong> the nodes or the sidebar titles.</p>' 
                    + '<p>When a node is activated, all of its direct links are highlighted, and the rest of the graph is dimmed. The related article labels appear on the left and right sides of the graph.</p>'
                    + '<p>Nodes are sized according the number of shared links within the domain: the larger the circle, the greater number of links that node is related to.</p>'
                    + '<p>Articles can appear in multiple domains, but are always colored by their primary domain designation.</p>'

                    let collapseNote = '<p>Please note: this panel will collapse automatically when a node is activated.</p>' 

    let domainIntroContent = domainIntroPanel.append('div')
        .attr('id','domainIntroContent')
        .style('display', 'block')
    
    domainIntroContent.append('div')
        .html(introText)
        .classed('panelParagraphText', true)

    domainIntroContent.append('div')
        .html(collapseNote)
        .classed('panelParagraphText', true)
        .style('font-weight', 'bold')

    // ui/ux interactions
    domainIntroHeading
        .on('mouseover', function() { activateItemLink(this) })
        .on('mouseout', function()  { deActivateItemLink(this) })
        .on('click', function()  {
         let currentState = domainIntroContent.style('display')
 
        if(currentState === 'block') {
            toggleDomainIntroContent('off')
            // toggleArticleIntroContent('on')
            // toggleDomainDetailsContent('on')
        }   else if(currentState === 'none')   {
            toggleDomainIntroContent('on')
            // toggleArticleIntroContent('off')
            // toggleDomainDetailsContent('off')
         } 
            
     })
}

function toggleDomainIntroContent(state) {
    let domainHeadingPanel = d3.select('#domainIntroHeading')
    let domainIntroContentArea = d3.select("#domainIntroContent")

    if (state==='on') {
        domainIntroContentArea.transition().duration(500).style('display', 'block')
        domainHeadingPanel
            .classed('toggleOnBG_User', true)
            .classed('toggleOffBG_User', false)

            toggleArticleIntroContent('off')
            toggleDomainDetailsContent('off')
    }

    if(state==='off') {
        domainIntroContentArea.transition().duration(500).style('display', 'none')
        domainHeadingPanel
            .classed('toggleOnBG_User', false)
            .classed('toggleOffBG_User', true)

            toggleArticleIntroContent('on')
            toggleDomainDetailsContent('on')
    }

    window.getSelection().removeAllRanges();


}

function setDomainCountPanel(parentDiv, domainData, data) {
    let domainCountPanel = parentDiv.append("div")
        .classed("panelBG", true)
        .attr('id', 'domainCountPanel')  
        .classed("linkCountDiv", true)

    domainCountPanel.append("h2")
        .html(`<span class="badge badge-pill badge-light">${domainData.nodes.length}</span> Domain Articles`)
        .classed('linkCountText', true)
}
function setCentralNodesPanel(parentSidebar, domainData, data) {

    let centralNodesDiv = parentSidebar.append("div")
        .classed('panelBG', true)
        .attr('id','domainCentralNodesPanel')

    let centralNodesHeading = centralNodesDiv.append("h2")
        .html("Most Connected Nodes")
        .classed('panelHeading', true)

    let centralNodesContentArea = centralNodesDiv.append('div')
        .attr('id', 'centralNodesContentArea')
        
    //sort domain nodes from most links to least, and then add the top 5 nodes to the centralNodes array
    domainData.nodes.sort((a,b) => d3.descending(a.numLinks, b.numLinks))
    let centralNodes = [];
    domainData.nodes.forEach((node,index) => {
        if (index < 5 ) {
            centralNodes.push(node)
        }
    })

    centralNodesContentArea.append("ul")
        .selectAll(".centralNodeArticles")
        .data(centralNodes)
        .enter()
            .append('li')
            .html(function(d) {return ` <span class="badge badge-pill badge-light">${d.numLinks}</span> ${d.title}`})
            .style("color", function(d) {return color(d.primary_domain)})
            .classed('centralNodeArticles', true)
            .classed('panelListItem_numbered', true)
        .exit().remove()

    let centralNodesHelp = setPanelHelp(centralNodesContentArea, 'Most Connected Nodes Help', 'panelHelpRightSideBar', '#centralNodesHelp')
    centralNodesHelp
        .on('mouseover', function() {activateItemLink(this); })
        .on('mouseout', function() {deActivateItemLink(this)})
        .on('click', function() { toggleHelpPage('#graphHelpCentralNodes')})
            

    let centralNodesList = d3.selectAll('.centralNodeArticles')
        centralNodesList.on('mouseover', function() { mouseOverDomainNode(this, data, domainData); toggleDomainIntroContent('off'); })
        centralNodesList.on('mouseout', function() { mouseOutDomainNode(this, data, domainData)})
        centralNodesList.on('click', function() { if(isNavFullOpacity()) { sngClickDomainNode(this, data, domainData)}})
        centralNodesList.on('dblclick', function() { if(isNavFullOpacity()) { dblClickDomainNode(this, data)}})

}

function setDomainArticleListPanel(parentSidebar, domainData, data) {
    // create domain article list div
    let domainArticleListDiv = parentSidebar.append("div")

    domainArticleListDiv
        .classed('panelBG', true)
        .attr('id','domainArticlesPanel')

    domainArticleListDiv.append("h2")
        .text("List of All Domain Articles")
        .classed('panelHeading', true)

    let articleListAreaDiv = domainArticleListDiv.append('div')
        .classed("domainArticleList", true)
        .attr('id','domainArticleListContentArea')
        .classed('scrollbars', true)

    //sort nodes in alphabetical order
    domainData.nodes.sort((a,b) => d3.ascending(a.title, b.title))

    articleListAreaDiv.append("ul")
        .selectAll(".domainArticle")
        .data(domainData.nodes)
        .enter()       
            .append("li")             
            .html(function(d) {return ` <span class="badge badge-pill badge-light">${d.numLinks}</span> ${d.title}`})
                .style('color', function(d)  { return color(d.primary_domain)})
                .classed('domainArticle', true)
                .classed('panelListItem_numbered', true)
        .exit().remove()



    let domainArticlesHelp = setPanelHelp(domainArticleListDiv, 'Domain Articles Help', 'panelHelpRightSideBar', '#domainArticlesHelp')
    domainArticlesHelp
            .on('mouseover', function() {activateItemLink(this)})
            .on('mouseout', function() {deActivateItemLink(this)})
            .on('click', function() { toggleHelpPage('#graphHelpListOfDomainArticles')})

    let domainArticleList = d3.selectAll('.domainArticle')
    
    domainArticleList.on('mouseover', function() {mouseOverDomainNode(this, data, domainData)})
    domainArticleList.on('mouseout', function() {mouseOutDomainNode(this, data, domainData)})
    domainArticleList.on('click', function() { if(isNavFullOpacity()) { sngClickDomainNode(this, data, domainData)}})
    domainArticleList.on('dblclick', function() {if(isNavFullOpacity()) { dblClickDomainNode(this, data)}})

}

function previewDomainNode(mouseOverReference, data, domainTitle) {
    currentDomainCentralNode = getDomainCentralNode()

    let selectedArticle = d3.select(mouseOverReference)
        .classed('domainMainNode', true)

    focusOnDomainArticle(selectedArticle.datum());
    updateSidebarLeft_DomainMain(selectedArticle.datum())
    setListItemStyle_NeighborNodeOpacity();
    
}

function exploreDomainNode(domainNode) {

    focusOnDomainArticle(domainNode.datum());
    updateSidebarLeft_DomainMain(domainNode.datum())
    currentDomainCentralNode = getDomainCentralNode()
    setListItemStyle_DomainCentralNode(currentDomainCentralNode)
    setListItemStyle_NeighborNodeOpacity()
    exploreMode = true
}


function dblClickDomainNode(dblClickReference) {
    // get node or label activated
    let activeElement = d3.select(dblClickReference)
    activeElement
        .style("cursor", "pointer")
        .style("font-weight", "bold")
    
    // resetDisplayDefaultsDomainGraph();
    resetDisplayDefaultsArticleGraph();

    let articleTitle = activeElement.datum().title
    showArticleGraph(articleTitle)
}

function sngClickDomainNode(mouseOverReference, data, domainTitle) {
    let selectedArticle = d3.select(mouseOverReference)
    let fontWeight = selectedArticle.style('font-weight')


    if(fontWeight === 'normal' || fontWeight==='400') {
        selectedArticle
            .classed('domainMainNode', true)

        focusOnDomainArticle(selectedArticle.datum());
        updateSidebarLeft_DomainMain(selectedArticle.datum());

        currentDomainCentralNode = getDomainCentralNode()
        setListItemStyle_DomainCentralNode(currentDomainCentralNode)
        setListItemStyle_NeighborNodeOpacity()
        setNavTip('On')
        setGraphMode('Click')
    } else {
        selectedArticle.transition().duration(200).style('font-weight', 'normal')
        setGraphMode('Hover')
        setNavTip('Off')
    }

        
}
function mouseOverDomainNode(mouseOverReference, data, domainTitle) {
    
    let selectedNode = d3.select(mouseOverReference).datum()

    if(!exploreMode) { activateItemLink(mouseOverReference); previewDomainNode(mouseOverReference, data, domainTitle); setNavTip('On')}
    if(exploreMode) {
        currentDomainCentralNode = getDomainCentralNode()
        let selectedNode = d3.select(mouseOverReference).datum()
        let nodeCircle = d3.selectAll('.node').filter(function (d,i) { return d.id === selectedNode.id })


        if(+nodeCircle.style('opacity') >= styConfig.nodeLabel.neighborNodeOpacity) {
            activateItemLink(mouseOverReference)
            updateSidebarLeft_DomainMain(selectedNode);
            nodeCircle.style('opacity', styConfig.nodeLabel.defaultOpacity)
            let selectedLabel = getD3PlusLabel(selectedNode.id)
            let selectedLabelLocationData = getDomainLabelLocationData(selectedLabel)
            if(nodeCircle.id !== currentDomainCentralNode.id ) {}
            drawDomainLinkLine(selectedLabelLocationData,nodeCircle)
            priorNodeCircle_ListItem = nodeCircle
        }  

    }
}
function mouseOutDomainNode(mouseOutReference, data, domainTitle) {
    deActivateItemLink(mouseOutReference)

    if(!exploreMode) { resetDisplayDefaultsDomainGraph(); toggleDomainIntroContent('off') } 
    if(exploreMode) { 
        let selectedNode = d3.select(mouseOutReference).datum()
        d3.selectAll('.relatedLinkLines').style('opacity',styConfig.linkLines.inactiveOpacity)
        if(typeof(currentDomainCentralNode.title) !== null ) {
            if(selectedNode.title !== currentDomainCentralNode.title) { 
                if(priorNodeCircle_ListItem) { priorNodeCircle_ListItem.style('opacity', styConfig.nodeLabel.neighborNodeOpacity) }
                 }
                 updateSidebarLeft_DomainMain(currentDomainCentralNode)
                //  updateSideBarLeft_ArticleMain(currentDomainCentralNode, 'Explore')
        }
        priorNodeCircle_ListItem = null

    }

}
function updateNeighborNodes() {
    neighborNodes.length = 0
    graphLinks.forEach(function (d) {
        neighborNodes[d.source.id + "-" + d.target.id] = true;
        neighborNodes[d.target.id + "-" + d.source.id] = true;
    });
}
function isNeighborNode(a, b) {
    return a == b || neighborNodes[a + "-" + b];
}
function focusOnDomainArticle(activeElement) {

    d3.selectAll('.link').transition().duration(300).attr("opacity", function (link) {
        return link.source.id === activeElement.id  || link.target.id === activeElement.id ? styConfig.link.activeDomainOpacity : styConfig.link.inactiveDomainOpacity;
    });

    d3.selectAll('.node').transition().duration(300).style("opacity", function (node) {
        if(activeElement.id === node.id) {
            return styConfig.nodeLabel.defaultOpacity
        }   else {
            return isNeighborNode(activeElement.id, node.id) ?  styConfig.nodeLabel.neighborNodeOpacity : styConfig.nodeLabel.notInArrayOpacity;
        }
    });
    
    positionRelatedDomainLabels(activeElement);
    toggleDomainIntroContent('off')

}
function getDomainCentralNode() {
    let domainCentralNodeData;

    let domainCentralNodeTextBox = d3.select('.mainDomainNode').select('g').node()
    if(domainCentralNodeTextBox !== null) {
        domainCentralNodeData = getDomainNodeFromD3Plus(domainCentralNodeTextBox)
    }   else {
        domainCentralNodeData = null
    }
    
    return domainCentralNodeData
}

function setListItemStyle_DomainCentralNode(domainCentralNode) {
    d3.selectAll('.centralNodeArticles').each(function (d) {
        if(d.id === domainCentralNode.id) {
            let mainNode = d3.select(this)
            mainNode.transition().duration(200).style('font-weight', 'bold')
        }   else {
            let othernode = d3.select(this)
            othernode.transition().duration(200).style('font-weight', 'normal')
        }
    })
    d3.selectAll('.domainArticle').each(function (d) {
        if(d.id === domainCentralNode.id) {
            let mainNode = d3.select(this)
            mainNode.transition().duration(200).style('font-weight', 'bold')
        }   else {
            let othernode = d3.select(this)
            othernode.transition().duration(200).style('font-weight', 'normal')
        }
    })
}

function setListItemStyle_NeighborNodeOpacity() {
 
    let domainLabels = d3.selectAll('.d3plus-textBox').data()
    let labelsText = domainLabels.map(label => label.data.title)

    d3.selectAll('.centralNodeArticles').each(function (d) {
        if(labelsText.includes(d.title)) {
            d3.select(this).transition().duration(200).style('opacity',styConfig.listItems.defaultOpacity)
        }   else {
            d3.select(this).transition().duration(200).style('opacity',styConfig.listItems.dimmedOpacity)
        }
    })
    d3.selectAll('.domainArticle').each(function (d) {
        if(labelsText.includes(d.title)) {
            d3.select(this).transition().duration(200).style('opacity',styConfig.listItems.defaultOpacity)
        }   else {
            d3.select(this).transition().duration(200).style('opacity',styConfig.listItems.dimmedOpacity)
        }
    })
}

function getLabelObj(circle,node) {
    let nodeCX = +circle.attr('cx')
    let nodeCY = +circle.attr('cy') 
    let nodeRadius = +circle.attr('r')
    let nodeID = circle.attr('nodeID')
    let nodePrimaryDomain = node.primary_domain
    let nodeTitle = node.title
    let labelObj = {'id':nodeID, 'cx':nodeCX, 'cy': nodeCY, 'r': nodeRadius,
                    'text':nodeTitle, 'title':nodeTitle, 'primaryDomain':nodePrimaryDomain}
    
    return labelObj
}

function positionRelatedDomainLabels(activeElement) {

    let domainLabelsGroup = simConfig.domainLabels
        domainLabelsGroup
            .html('')
            .style('opacity',styConfig.nodeLabel.defaultOpacity)

    let currentMainNode = [];
    let linkedNodes = [];
        
    d3.selectAll('.node').each(function(node,index) {
        let nodeCircle = d3.select(this)
        let nodeID = nodeCircle.attr('nodeID')
        if(activeElement.id === nodeID) {
            currentMainNode.push(getLabelObj(nodeCircle,node))
        }   else {
            if(isNeighborNode(activeElement.id, nodeID)) {
                linkedNodes.push(getLabelObj(nodeCircle,node))
            }
        }    
    })

    linkedNodes.sort((a,b) => d3.ascending(a.text, b.text))

    let midPoint = parseInt(linkedNodes.length/2)
    let domainLabelsLeft = linkedNodes.slice(0,midPoint);
    let domainLabelsRight = linkedNodes.slice(midPoint);




    let domainLeftMinMax = d3.extent(domainLabelsLeft, d=> d.cy)
    let domainRightMinMax = d3.extent(domainLabelsRight, d=> d.cy)

    //style .mainDomainNode     
    let mainNodeArea = domainLabelsGroup.append('g')
        .classed('mainDomainNode', true)

    new d3plus.TextBox()
        .data(currentMainNode)
        .select('.mainDomainNode')
        .y(function(d) {return d.cy - d.r})
        .x(function(d) {return setDomainXpos(d.cx,d.r,175)})
        .fontFamily('proxima-nova, sans-serif')
        .fontSize(18)
        .fontColor(function(d) {return color(d.primaryDomain)})
        .verticalAlign('top')
        .textAnchor(function (d) { return (d.cx > 0) ? 'end' : 'start' })
        .width(175)
        .lineHeight(20)
        .height(150)
        .render();

    //left side nodes and labels
    let labelListLeftGroup = domainLabelsGroup.append('g')
        .attr('x', '-400')
        .attr('y', '-400')
        .classed('domainLabelLeftGroup', true)

        new d3plus.TextBox()
        .data(domainLabelsLeft)
        .select('.domainLabelLeftGroup')
        .y(function(d, i) {return placeLabel(i, domainLabelsLeft)})
        .x(-475)
        .fontFamily('proxima-nova, sans-serif')
        .fontSize(function (d) {return (domainLabelsLeft.length > 30 ? 14 : 15)})
        .fontColor(function(d) {return color(d.primaryDomain)})
        .verticalAlign('top')
        .textAnchor('start')
        .width(350)
        .lineHeight(14)
        .height(35)
        .render();

    //right side nodes and labels
    let labelListRightGroup = domainLabelsGroup.append('g')
        .attr('x', '400')
        .attr('y', `-400`)
        .classed('domainLabelRightGroup', true)

    new d3plus.TextBox()
        .data(domainLabelsRight)
        .select('.domainLabelRightGroup')
        .y(function(d, i) {return placeLabel(i, domainLabelsRight)})
        .x(130)
        .textAnchor('end')
        .fontFamily('proxima-nova, sans-serif')
        .fontSize(function (d) {return (domainLabelsLeft.length > 30 ? 14 : 15)})
        .fontColor(function(d) {return color(d.primaryDomain)})
        .verticalAlign('top')
        .width(350)
        .lineHeight(14)
        .height(40)
        .render();

        // UX/UI functions 
        let mainDomainNodeLabel = d3.select('.mainDomainNode')
            mainDomainNodeLabel.transition().duration(50).style('fill-opacity', styConfig.nodeLabel.defaultOpacity)
        
        let domainLabelsList = d3.selectAll('.d3plus-textBox')

        domainLabelsList.transition().duration(200).style('fill-opacity', styConfig.nodeLabel.defaultOpacity)
    
        domainLabelsList.on('mouseover', function() {mouseOverTextBox(this)})
        domainLabelsList.on('mouseout', function() {mouseOutTextBox(this)})
        domainLabelsList.on('click', function() { sngClickTextBox(this) })
        domainLabelsList.on('dblclick', function() {dblClickTextBox(this)})

        function mouseOverTextBox(mouseOverReference) {
            activateItemLink(mouseOverReference)

            // let currentDomainNodeTextBox = d3.select('.mainDomainNode').select('g').node()
            // currentMainNodeTitle = getDomainNodeFromD3Plus(currentDomainNodeTextBox)
            currentDomainCentralNode = getDomainCentralNode()


            let selectedNode = getDomainNodeFromD3Plus(mouseOverReference)
            let nodeCircle = d3.selectAll('.node').filter(function (d,i) { return d.id === selectedNode.id })
            nodeCircle.style('opacity', styConfig.nodeLabel.defaultOpacity)

            let selectedLabel = d3.select(mouseOverReference)
            let selectedLabelLocationData = getDomainLabelLocationData(selectedLabel)
            if(selectedNode.title !== currentDomainCentralNode.title) { drawDomainLinkLine(selectedLabelLocationData, nodeCircle) }
            
            updateSidebarLeft_DomainMain(selectedNode)
            

            priorNodeCircle = nodeCircle
        }

        function mouseOutTextBox(mouseOutReference) {
            deActivateItemLink(mouseOutReference)

            let selectedNode = getDomainNodeFromD3Plus(mouseOutReference)

            d3.selectAll('.relatedLinkLines').style('opacity',0)

            if(selectedNode.title !== currentDomainCentralNode.title) { priorNodeCircle.style('opacity', styConfig.nodeLabel.neighborNodeOpacity) }

            updateSidebarLeft_DomainMain(currentDomainCentralNode)
            
        }

        let isDblClick = false;
        function sngClickTextBox(mouseClickReference) {
            d3.selectAll('.relatedLinkLines').style('opacity',0)
            let selectedNode = getDomainNodeFromD3Plus(mouseClickReference)
            setTimeout(function() { 
                if(!isDblClick) {
                    focusOnDomainArticle(selectedNode);
                    updateSidebarLeft_DomainMain(selectedNode)
                    
                    let currentDomainCentralNode = getDomainCentralNode()
                    setListItemStyle_DomainCentralNode(currentDomainCentralNode)
                    setListItemStyle_NeighborNodeOpacity()

                }
                }, 300)
        }

        function dblClickTextBox(mouseClickReference) {
            isDblClick = true;
            let selectedNode = getDomainNodeFromD3Plus(mouseClickReference)
            resetDisplayDefaultsDomainGraph();
            showArticleGraph(selectedNode.title)
        }


}
function placeLabel(index, domainArray) {
    let cyMin;
    let cyMax;
    let arrayLength = domainArray.length
    
    if (arrayLength <= 10) {cyMin = -200; cyMax = 200}
    if (arrayLength > 10 && arrayLength <= 20) {cyMin = -250; cyMax = 225}
    if (arrayLength > 20 && arrayLength <= 30) {cyMin = -275; cyMax = 275}
    if (arrayLength > 30 ) {cyMin = -300; cyMax = 375}

    let totalHeight = Math.abs(cyMin) + Math.abs(cyMax)
    let itemOffset;
    if (arrayLength <= 30) {itemOffset = (totalHeight/arrayLength)}
    if (arrayLength > 30 && arrayLength <= 38) {itemOffset = ((totalHeight/arrayLength) * .6) + 5}
    if (arrayLength > 38) {itemOffset  = ((totalHeight/arrayLength) * .03) + 14}

    let returnCY = cyMin + ( index * ( itemOffset) )
    
    return returnCY
}

function getDomainLabelLocationData(domainLabel) {
    let labelX = domainLabel.datum().x
    let labelY = domainLabel.datum().y
    let height = domainLabel.node().getBBox().height
    let width = domainLabel.node().getBBox().width
    let widthOffset = 350
    let startX = labelX < 0 ? labelX + width + 5 :labelX + (widthOffset - width) + 5
    let startY = (labelY + (height/2));

    return {startX, startY}
}
function drawDomainLinkLine(labelData, nodeCircle) {

    let nodeCircleCX = +nodeCircle.attr('cx')
    let nodeCircleCY = +nodeCircle.attr('cy')
    let nodeCircleDomain = nodeCircle.datum().primary_domain

    let linkLinesGroup = simConfig.relatedLinks
    linkLinesGroup.html('')
    linkLinesGroup
            .style('opacity', styConfig.linkLines.domainGraphOpacity)


    linkLinesGroup
        .append('line')
        .attr('x1', labelData.startX)
        .attr('y1', labelData.startY)
        .attr('x2', nodeCircleCX)
        .attr('y2', nodeCircleCY)
        .attr('id', 'test')
        .style('stroke', function() {return color(nodeCircleDomain)})
        .classed('relatedLinkLines', true)
        .transition().duration(200).style('opacity', styConfig.linkLines.domainGraphOpacity)

}

function getD3PlusLabel(nodeID) {
    let selectedLabel = d3.selectAll('.d3plus-textBox').filter(function(d) { return d.id === nodeID})
    return selectedLabel 

}
function getD3PlusIDString(nodeID) {
    let d3PlusLabelID = 'd3plus-textbox-' + nodeID.replace(/\//g,'')
    return d3PlusLabelID
}
function getDomainNodeFromD3Plus(mouseReference) {
    let returnNode;

    if (typeof(mouseReference.id) !== 'undefined') {
        let baseDomainID = mouseReference.id
        let domainID = baseDomainID.substring(15).replace(/entries/,'/entries/')
        domainID = domainID + '/'
        let domainNode = graphNodes.filter(node => node.id === domainID)
        returnNode = domainNode[0]
    }   else    {
        returnNode = 'None'
    }


    return returnNode

}

function resetDisplayDefaultsDomainGraph() {

    resetDomainMenuOpacity();

    if(graphType==='Domain') { updateSidebarLeft_DomainMain(); } 
    

    let links = d3.selectAll('.link')
        .transition().duration(200).attr("opacity", styConfig.link.defaultOpacity);

    let nodes = d3.selectAll('.node')
        .transition().duration(200).style("opacity", styConfig.nodeLabel.defaultOpacity);
    
    let linkLines = d3.selectAll('.relatedLinkLines')
        .transition().duration(200).style('opacity',styConfig.linkLines.inactiveOpacity)

    d3.selectAll('.d3plus-textBox')
        .transition().duration(200).style('opacity',styConfig.nodeLabel.defaultOpacity)

    let domainLabelsGroup = simConfig.domainLabels
    
    domainLabelsGroup
        .transition().duration(200).style('opacity',styConfig.nodeLabel.inactiveOpacity)
        
    domainLabelsGroup.html('')

    setNavTip('Off')
} 

function resetDomainMenuOpacity() {
    let centralNodes = d3.selectAll('.centralNodeArticles')
        .transition().duration(200)
            .style('opacity',1)
            .style('font-weight','normal')

    let domainArticles = d3.selectAll('.domainArticle')
    .transition().duration(200)
        .style('opacity',1)
        .style('font-weight','normal')
}



//******************** Array & Set Operations ************************/
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set

function combineLinks(searchID, biLinks, outLinks, inLinks) {
    let _combinedLinks = []

    biLinks.forEach(biLink => {
        let link = { 'source': searchID, 'target': biLink, 'direction': 'bi'}
        _combinedLinks.push(link)
    })

    outLinks.forEach(outlink => {
        let link = { 'source': searchID, 'target': outlink, 'direction': 'out'}
        _combinedLinks.push(link)
    })

    inLinks.forEach(inLink => {
        let link = { 'source': searchID, 'target': inLink, 'direction': 'in'}
        _combinedLinks.push(link)
    })


    // _combinedLinks.forEach(link => {
    //     data.articles.nodes.forEach(node => {
    //         if(node.id === link.target) { 
    //             link['targetTitle'] = node.title 
    //         }

    //     })
        
    // })

    // _combinedLinks.sort((a,b) => d3.ascending(a.targetTitle, b.targetTitle))
    return _combinedLinks


}
function intersection(setA, setB) {
    let _setA = new Set(setA)
    let _setB = new Set(setB)
    let _intersection = new Set()
    for (let elem of _setB) {
        if (_setA.has(elem)) {
            _intersection.add(elem)
        }
    }
 
    return _intersection
}
function symmetricDifference(setA, setB) {
    let _setA = new Set(setA)
    let _setB = new Set(setB)
    let _difference = new Set(setA)
    for (let elem of _setB) {
        if (_difference.has(elem)) {
            _difference.delete(elem)
        } else {
            _difference.add(elem)
        }
    }
    return _difference
}


//******************** UX Activation FUNCTIONS FOR INTERACTIVITY ************************/


// ********* Domain Graph Ingteraction functions ***********

// runs when a node or label on the Domain Graph is dbl-clicked


// ********* Article Graph Interaction functions ***********

// runs when a node or label on the Article Graph is dbl-clicked





//******************** Simulation Helpers ************************/

function forceStrength(numberOfNodes) {

    let strength;
    if (numberOfNodes <= 10) { strength = -300 } //1000
    if (numberOfNodes > 10 && numberOfNodes <= 20) { strength = -260 } //1000
    if (numberOfNodes > 20 && numberOfNodes <= 30) { strength = -240 } //800
    if (numberOfNodes > 30 && numberOfNodes <= 40) { strength = -200 } //600
    if (numberOfNodes > 40 && numberOfNodes <= 50) { strength = -160} //400
    if (numberOfNodes > 50 && numberOfNodes <= 60) { strength = -120 } //200
    if (numberOfNodes > 60 && numberOfNodes <= 70) { strength = -80 } //100
    if (numberOfNodes > 70 && numberOfNodes <= 80) { strength = -70 }  
    if (numberOfNodes > 80 && numberOfNodes <= 90) { strength = -40 }  
    if (numberOfNodes > 90) { strength = -20 }  

    return strength

}
function ticksByNodeCount(numberOfNodes) {
    let tickLimit;
    if (numberOfNodes <= 10) { tickLimit = 50 } 
    if (numberOfNodes > 20 && numberOfNodes <= 20) { tickLimit = 80 } 
    if (numberOfNodes > 30 && numberOfNodes <= 30) { tickLimit = 100 } 
    if (numberOfNodes > 40 && numberOfNodes <= 40) { tickLimit = 150 } 
    if (numberOfNodes > 50 && numberOfNodes <= 60) { tickLimit = 200 } 
    if (numberOfNodes > 60 && numberOfNodes <= 70) { tickLimit = 250 }  
    if (numberOfNodes > 70 && numberOfNodes <= 80) { tickLimit = 200 }  
    if (numberOfNodes > 80 && numberOfNodes <= 90) { tickLimit = 250 }  
    if (numberOfNodes > 90) { tickLimit = 100 }

    return tickLimit
}
function angle(x1, y1, x2, y2) {
    var dy = y2 - y1;
    var dx = x2 - x1;
    var theta = Math.atan2(dy, dx); // range (-PI, PI]
    theta *= 180 / Math.PI; // rads to degs, range (-180, 180]
    // if (theta < 0) theta = 360 + theta; // range [0, 360)
    return theta;
}
function rotateLabel(labelI, xPos, yPos){
    rotateVal = linkAngles[labelI]
    if (xPos > 0 ){
        // rotateReturn = 'rotate(0)'
         rotateReturn = `rotate(${rotateVal},${xPos},${yPos})`
    }   else {
        // rotateReturn = 'rotate(0)'
        rotateReturn = `rotate(${rotateVal+180},${xPos},${yPos})`
    }
    return rotateReturn
}
function setArticleXpos(distX,textwidth) {
    if ( distX > 0) {
        returnX = distX + 12
    }   else {
        returnX = distX - textwidth - 12
    }
    return returnX
}
function setDomainXpos(nodeCX, radius,textWidth) {
    let returnX;
    let textWidthValue = (typeof(textWidth)==='undefined') ? 0 : textWidth
    if ( nodeCX > 0) {
        returnX = (nodeCX - textWidthValue - radius - 5) 
    }   else {
        returnX = (nodeCX + radius + 5) 
    }
    return returnX
}
function setDomainYpos(distY, radius) {
    let returnY = distY - radius
    return returnY
}

function setDomainXpos_old(distX, radiusScale,textWidth) {
    let returnX;
    let textWidthValue = (typeof(textWidth)==='undefined') ? 0 : (textWidth/2)
    if ( distX > 0) {
        returnX = distX - 5 - textWidthValue - radiusScale
    }   else {
        returnX = distX + 5 + textWidthValue  + radiusScale
    }
    return returnX
}
function setDomainYpos_old(distY, radiusScale ,textHeight) {
    let returnY;

    if ( distY > 0) {
        returnY = distY + (textHeight/2) + radiusScale + 5
    }   else {
        returnY = distY - (textHeight/2)  - radiusScale 
    }
    return returnY
}
function color(entryType){
    let rgbValue = '';
    
    switch(entryType) {

        // yellow 
        case 'Thinker':
            rgbValue = 'rgb(180,255,249)'

            break;

        // purples
        case 'Aesthetics and Philosophy of Art':
            rgbValue = 'rgb(184, 108, 237)' 
            break;

        // violet 
        case 'Philosophy of Religion':
            rgbValue = 'rgb(156, 20, 252)' 

            break;

        // social and political philosophies
        // reds
        case 'Ethics':
            rgbValue = 'rgb(230, 97, 97)' //#FF8BA3
            break;

        case 'Social and Political Philosophy': //#E44C96
            rgbValue = 'rgb(192, 2, 96)'
            break;
    
        case 'Philosophy of Law':
            rgbValue = 'rgb(251, 3, 114)' //#FF7D63
            break;
    
        case 'Philosophy of Economics':
            rgbValue = 'rgb(238, 50, 170)' //#FF1D12
            break;
    
        case 'Feminist Philosophy':
            rgbValue = 'rgb(238, 4, 4)' //#FF642C
            break;

        // cultural philosophies
        // orange tones 

        case 'Continental Philosophy':
            rgbValue = 'rgb(170, 50, 3)' //#FF6700
            break;

        case 'Chinese Philosophy':
            rgbValue = 'rgb(235, 66, 3)' //#FF992D
            break;   

        case 'Japanese Philosophy':
            rgbValue = 'rgb(191, 88, 12)' //#FF9901
            break;

        case 'Indian Philosophy':
            rgbValue = 'rgb(255, 159, 101)' //#FFA800
            break;

        case 'Latin American and Iberian Philosophy':
            rgbValue = 'rgb(237, 100, 68)' //#FFCB56
            break;

        case 'Arabic and Islamic Philosophy':
            rgbValue = 'rgb(255, 128, 0)' //#FFC007
            break;

        case 'African and African-American Philosophy':
            rgbValue = 'rgb(255, 165, 1)' //#FFD200
            break;

        case 'Jewish Philosophy':
            rgbValue = 'rgb(255, 165, 1)' //#FFD200
            break;
        // langauge, logic, math, computer science
        // greens
        case 'Logic':
            rgbValue = 'rgb(20,172,100)'
            break;

        case 'Philosophy of Mathematics':
            rgbValue = 'rgb(0,255,80)'
            break;

        case 'Philosophy of Computer Science':
            rgbValue = 'rgb(155,235,135)'
            break;

        case 'Philosophy of Language':
            rgbValue = 'rgb(172,247,76)'
            break;

        //blue green 
        case 'Metaphysics':
            rgbValue = 'rgb(2,255,208)' 
            break;

        case 'Epistemology':
            rgbValue = 'rgb(250,250,147)'
            break;
    
        case 'Philosophy of Mind':
            rgbValue = 'rgb(43, 162, 162)' 
            break;
    
    
        // scientific philosophies
        // blues

        case 'Philosophy of Science':
            rgbValue = 'rgb(0,111,255)'
            break;

        case 'Philosophy of Biology':
            rgbValue = 'rgb(10,205,255)'
            break;
    
        // case 'Evolution':
        //     rgbValue = 'rgb(94,190,203)'
        //     break;

        // case 'Genetics':
        //     rgbValue = 'rgb(0,168,255)'
        //     break;

        case 'Philosophy of Physics':
            rgbValue = 'rgb(70,144,255)'
            break;    

        // case 'Quantum Mechanics':
        //     rgbValue = 'rgb(35,173,255)'
        //     break;

        case 'Default Page':
            rgbValue = 'rgb(240, 219, 0)'
            break;
    }
    return rgbValue
}

function getRandom() {


    let randomEntry  = getRandomIntInclusive(0,allEntries.length)
    if (randomEntry <= allEntries.length-1) {
        
        showArticleGraph(allEntries[randomEntry].title)
    }   else {
        showDomainGraph(allEntries[randomEntry].title)
    }


}
function getRandomIntInclusive(min, max) {
    //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive 
  }
