// ****** Global Variables ******

// Select Page Elements
let svg = d3.select('#graphSVG')
let homePageDiv = d3.select('#homePageDiv')
let aboutPageDiv = d3.select('#aboutPageDiv')
let contactPageDiv = d3.select('#contactPageDiv')
let graphPageDiv = d3.select('#graphPageDiv')
let sidebarLeft = d3.select("#sidebarLeft") 
let sidebarRight = d3.select("#sidebarRight")
let vizLogo = d3.select('#vizLogo')
let navBar = d3.select('nav')
let pageTitle = d3.select('#pageTitle')
let copyright = d3.select('#copyright')

//Article Search Elements
let articleSearchButton = d3.select('#articleSearchButton')
let articleSearchArea = d3.select('#articleSearchArea')
let articleSearchFilter = d3.select('#articleSearchFilter')
let articleSearchListDiv = d3.select('#articleSearchListDiv')
let articleShowAllCheck = d3.select('#articleShowAllCheck')
let articleCloseSearchArea = d3.select('#articleCloseSearchArea')

//Domain Search elements
let domainSearchButton = d3.select('#domainSearchButton')
let domainSearchArea = d3.select('#domainSearchArea')
let domainSearchFilter = d3.select('#domainSearchFilter')
let domainSearchListDiv = d3.select('#domainSearchListDiv')
let domainShowAllCheck = d3.select('#domainShowAllCheck')
let domainCloseSearchArea = d3.select('#domainCloseSearchArea')

//Recent Search elements
let recentSearchDiv = d3.select('#recentSearchDiv')
let recentSearchButton = d3.select('#recentSearchButton')
let recentSearchArea = d3.select('#recentSearchArea')
let recentSearchFilter = d3.select('#recentSearchFilter')
let recentSearchListDiv = d3.select('#recentSearchListDiv')
let recentShowAllCheck = d3.select('#recentShowAllCheck')
let recentCloseSearchArea = d3.select('#recentCloseSearchArea')

let getRandomEntry = d3.select("#getRandomEntry")
let aboutPageLink = d3.select('#aboutPage')
let contactPageLink = d3.select('#contactPage')

let graphMode = d3.select("#graphMode")
let graphInstructions = d3.select("#graphInstructions")

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
let numArticles;
let numLinks;
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

let pageTransition = 300

//set BaseURL for SEP Edition
let sepEdition = "Fall 2020"
let baseURL = 'https://plato.stanford.edu/archives/fall2020';

// let json_file = 'static/sep_network.json'
let json_file = 'https://josephdicastro.github.io/VisualizingSEP/static/sep_network.json'

startVisualization();

function startVisualization() {
    loadMenuData();
    setNavigation();
    showContentPage(homePageDiv, '');


}


// ****** BASIC PAGE SHOW / HIDE FUNCTIONS ****** 
 
function setNavigation() {

    setNavBarTransition() 
    setHomePage()
    setArticleSearchElements();
    setDomainSearchElements();
    setRecentSearchElements();
    setAboutPage();
    setContactPage();

    let preservePanel = false;

    function setNavBarTransition() {
        navBar
            .transition().duration(pageTransition)
            .style('opacity',1)
            .on('end', function() {
                populateSearchResults(domainSearchListDiv, allDomains); 
                domainShowAllCheck.property('checked', true)
            })
    }

    function setHomePage() {
        vizLogo
            .on('mouseover', function() { activateItemLink(this)})
            .on('mouseout', function() { deActivateItemLink(this)})
            .on('click', function() { showContentPage(homePageDiv, '')})
        }

    // Article Searches
    function setArticleSearchElements() {
        //article search features
        articleSearchButton
            .on('mouseover', function() {articleSearchButton.classed('searchButtonActive', true)})
            .on('mouseout', function() {articleSearchButton.classed('searchButtonActive', false)})
            .on('click', function() {toggleArticleSearchArea(); hideDomainSearchArea(); hideRecentSearchArea();})

        articleSearchFilter
            .on('focusout', function() { 
                let articleFilter = d3.event.target.value
                if (articleFilter.length===0) {
                    setTimeout(function() {
                        if(!showAll) { hideArticleSearchArea() }
                    },200)
                }
            })
            .on('keyup', function() {
                let articleFilter = d3.event.target.value
                if(articleFilter.length === 0 || articleFilter.trim() === '') {
                    populateSearchResults(articleSearchListDiv, [])
                    showAll = false;
                }   else {
                    filterSearchList('Article',articleFilter);
                    showAll = false;
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


    // domain searches
    function setDomainSearchElements() {

        domainSearchButton
            .on('mouseover', function() {domainSearchButton.classed('searchButtonActive', true)})
            .on('mouseout', function() {domainSearchButton.classed('searchButtonActive', false)})
            .on('click', function() {toggleDomainSearchArea();})

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
            .on('click', function() {toggleRecentSearchArea();})

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

    //Get Random 
    getRandomEntry.on('click', function() { closeDropdowns(); getRandom() })
    
    // Search Process functions 
    function setFocusTo(element) {
        element.node().focus()
    }

    function populateSearchResults(searchAreaDiv, arrayOfTitles) {
        searchAreaDiv.html('')
        searchAreaDiv
            .transition().duration(350)
                .style('display', 'block')
                .style('opacity', 1)

            searchAreaDiv.append('ul')
                .selectAll('.searchResults')
                .data(arrayOfTitles)
                    .enter()
                    .append('li')
                        .append('a')
                        .attr('href','#')
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
            .on('mouseover', function() { activateItemLink(this)})
            .on('mouseout', function() { deActivateItemLink(this)})
            .on('click', function() { showAboutPage()})

    }

    function setContactPage() {
        contactPageLink
            .on('mouseover', function() { activateItemLink(this)})
            .on('mouseout', function() { deActivateItemLink(this)})
            .on('click', function() { showContactPage()})

        copyright
            .on('mouseover', function() { activateItemLink(this)})
            .on('mouseout', function() { deActivateItemLink(this)})
            .on('click', function() { showContactPage()})
    }

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

    pageToShow
        .style('display', 'block')
        .transition().duration(pageTransition)
            .style('opacity',1)

    setPageTitle(pageTitleText, 'Default Page')

}

function showAboutPage() {
    showContentPage(aboutPageDiv,"About Visualizing SEP")
}

function showContactPage() {
    showContentPage(contactPageDiv, "Contact Information")
}

function setModeInstructions() {
    graphMode
    .on('mouseover', function() {activateItemLink(this)})
    .on('mouseout', function() {deActivateItemLink(this)})
    .on('click', function() {toggleGraphMode();})
 
 graphInstructions
    .on('mouseover', function() {activateItemLink(this)})
    .on('mouseout', function() {deActivateItemLink(this)})
    .on('click', function() {displayGraphInstructions()})
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
    graphPageDiv.style('display','block')
    graphPageDiv.transition().duration(pageTransition).style('opacity',1);

    showSidebars();
    setModeInstructions();
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
    // let areaHeight = 950;

    let width = areaWidth - margin.left - margin.right;
    let height = areaHeight - margin.top - margin.bottom;

    svg.attr("viewBox", "0 50 " + width + " " + height )
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
        .alphaTarget(0.99)

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
        'notInArrayOpacity': 0.00,
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
        let domainSet = new Set()

        json.articles.nodes.forEach(node => {
            let nodeTitle = node.title
            let nodePrimaryDomain = node.primary_domain
            let wordCountText = parseInt(node.word_count.replace(',',''))
            allArticles.push({'title': nodeTitle, 'primary_domain': nodePrimaryDomain})
            domainSet.add(nodePrimaryDomain)
            wordCount += wordCountText
            
        })

        numArticles = allArticles.length

        let numArticlesDisplay = allArticles.length.toLocaleString();

        domainSet.forEach(domain => allDomains.push({'title': domain, 'primary_domain':domain}))
        allDomains.sort((a,b) => d3.ascending(a.title, b.title));

        allEntries = allArticles.concat(allDomains)


        aboutNumArticles.text(allArticles.length.toLocaleString())
        aboutNumLinks.text(json.articles.links.length.toLocaleString())
        aboutNumDomains.text(allDomains.length)
        aboutAvgWordCount.text(parseInt(wordCount/allArticles.length).toLocaleString())
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

function setGraphMode(mode) {

    graphMode
        .classed('baseStylesModeInstructions', true)

    if(mode==='Hover') {
        exploreMode = false; 
        graphMode
            .text('Graph Mode: Hover')
            .classed('graphModePreview', true)
            .classed('graphModeExplore', false)

        resetDomainMenuOpacity();
        resetDisplayDefaultsDomainGraph();
        resetDisplayDefaultsArticleGraph();
  }
    if(mode==='Click') {
        exploreMode = true;
        graphMode
            .text('Graph Mode: Click')
            .classed('graphModePreview', false)
            .classed('graphModeExplore', true)
    }
}

function setGraphType(graphState) {
    if(graphState==='Article') {graphType = graphState; setGraphInstructions('Article Graph Instructions') }
    if(graphState==='Domain') {graphType = graphState; setGraphInstructions('Domain Graph Instructions') }

}

function setGraphInstructions(instructionText) {
    graphInstructions
        .text(instructionText)
        .classed('baseStylesModeInstructions', true)
}

function displayGraphInstructions() {
    let instructionText = graphInstructions.text()

    dimScreen();

    if(instructionText.indexOf('Article') === 0 ) { 
        displayGraphInstructions_Article()
    }   else {
        displayGraphInstructions_Domain()
    }
}

function dimScreen() {
    let transDuration = 300

    navBar.transition(transDuration).style('opacity', 0.25)
    pageTitle.transition(transDuration).style('opacity', 0.25)
    sidebarLeft.transition(transDuration).style('opacity', 0.25)
    sidebarRight.transition(transDuration).style('opacity', 0.25)
    svgConfig.graphElements.transition(transDuration).style('opacity', 0.25)
    graphMode.transition(transDuration).style('opacity', 0.10)
    graphInstructions.transition(transDuration).style('opacity',0.10)
}

function resetScreen() {
    let transDuration = 300
    navBar.transition(transDuration).style('opacity', 1)
    pageTitle.transition(transDuration).style('opacity', 1)
    sidebarLeft.transition(transDuration).style('opacity',1)
    sidebarRight.transition(transDuration).style('opacity', 1)
    svgConfig.graphElements.transition(transDuration).style('opacity',1)
    graphMode.transition(transDuration).style('opacity', 1)
    graphInstructions.transition(transDuration).style('opacity',1)
}

function displayGraphInstructions_Article() {
    let transDuration = 450
    d3.select("#articleInstructions")
        .style('display','block')
        .transition()
            .duration(transDuration)
                .style('opacity',1)
        

    d3.select("#articleGraphHelp")
        .on('mouseover', function() {activateItemLink(this)})
        .on('mouseout', function() {deActivateItemLink(this)})
        .on('click', function() { showHelpPage("#articleGraphHelp")})

    d3.select("#articleGraphHelpLeft")
        .on('mouseover', function() {activateItemLink(this)})
        .on('mouseout', function() {deActivateItemLink(this)})
        .on('click', function() {showHelpPage("#articleGraphHelpLeft")})

    d3.select("#articleGraphHelpRight")
        .on('mouseover', function() {activateItemLink(this)})
        .on('mouseout', function() {deActivateItemLink(this)})
        .on('click', function() {showHelpPage("#articleGraphHelpRight")})

    d3.select("#articleGraphHelpNav")
        .on('mouseover', function() {activateItemLink(this)})
        .on('mouseout', function() {deActivateItemLink(this)})
        .on('click', function() {showHelpPage("#articleGraphHelpNav")})

   d3.select('#articleGraphInstructionsHeading')
        .on('mouseover', function() {activateItemLink(this)})
        .on('mouseout', function() {deActivateItemLink(this)})
        .on('click', function() { 
            d3.select('#articleInstructions').transition().duration(transDuration).style('opacity',0)
            d3.select('#articleInstructions').style('display','none')
            resetScreen();

    })


    showHelpPage('#articleGraphHelp')
    
}

function displayGraphInstructions_Domain() {
    let transDuration = 450
    d3.select("#domainInstructions")
        .style('display','block')
        .transition().duration(transDuration).style('opacity',1)

    d3.select("#domainGraphHelp")
        .on('mouseover', function() {activateItemLink(this)})
        .on('mouseout', function() {deActivateItemLink(this)})
        .on('click', function() { showHelpPage("#domainGraphHelp")})

    d3.select("#domainGraphHelpLeft")
        .on('mouseover', function() {activateItemLink(this)})
        .on('mouseout', function() {deActivateItemLink(this)})
        .on('click', function() {showHelpPage("#domainGraphHelpLeft")})

    d3.select("#domainGraphHelpRight")
        .on('mouseover', function() {activateItemLink(this)})
        .on('mouseout', function() {deActivateItemLink(this)})
        .on('click', function() {showHelpPage("#domainGraphHelpRight")})

    d3.select("#domainGraphHelpNav")
        .on('mouseover', function() {activateItemLink(this)})
        .on('mouseout', function() {deActivateItemLink(this)})
        .on('click', function() {showHelpPage("#domainGraphHelpNav")})

    d3.select('#domainGraphInstructionsHeading')
        .on('mouseover', function() {activateItemLink(this)})
        .on('mouseout', function() {deActivateItemLink(this)})
        .on('click', function() { 
            d3.select('#domainInstructions').transition().duration(transDuration).style('opacity',0)
            d3.select('#domainInstructions').style('display','none')
            resetScreen();
        })

    showHelpPage('#domainGraphHelp')
}

function showHelpPage(divID) {

    let pageID = divID + "Div"

    //help menu
    d3.selectAll('.helpMenu > li')
        .style('color', '#E6E6E6')

    d3.select(divID)
        .style('color', '#F0DB00')

    //help pages
    d3.selectAll('.instructionsSection')
        .style('display', 'none')
    
    d3.select(pageID)
        .style('display', 'block')
}

function toggleGraphMode() {
    if(exploreMode) {
        setGraphMode('Hover')
    } else {
        setGraphMode('Click')
    }

    window.getSelection().removeAllRanges();
}
// ****** ARTICLE GRAPH DATA AND SIMULATION FUNCTIONS ****** 




function showArticleGraph(articleTitle) {
    d3.json(json_file).then((json) => {
        // simConfig = initializeSimulation(svgConfig);  
        showGraphPage();
        let articleData = getArticleData(json,articleTitle)
        setGlobalNodesLinks(articleData)
        let articleNode = graphNodes[0]
        drawArticleSimulation(json)
        setPageTitle(articleTitle, articleData.primaryDomain)
        updateRecentSearch({'title': articleTitle, 'primary_domain': articleData.primaryDomain},'Article');
        d3.select('.mainDomainNode').remove();
        setGraphMode('Hover')
        setGraphType('Article')
        resetDisplayDefaultsDomainGraph();
        resetDisplayDefaultsArticleGraph();
        updateSidebarsArticle(json, articleNode);
        showAll = false;

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
                //  .attr("font-size", styConfig.nodeLabel.defaultFontSize)
                 .attr("fill", function(d) {return color(d.primary_domain)})
                 .attr('nodeID', function(d) {return d.id})
                 .classed('label',true)
                 .classed('mainArticleLabel', function(d,i) {return i===0?true:false})
                 .merge(label)

    label
        .on('mouseover', function() {mouseOverArticleNode(this, data,'fill-opacity')})
        .on('mouseout', function() {mouseOutArticleNode(this, data)})
        .on('click', function()  { sngClickArticleNode(this, data, 'opacity')})
        .on('dblclick', function() {dblClickArticleNode(this)})


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
        .on('dblclick', function()  {dblClickArticleNode(this)})

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
        .distance(225)//function () {return (countOfNodes > 50) ? 200 : 175})
        .links(graphLinks)
    simConfig.simulation.force("forceX").strength(0)
    simConfig.simulation.force("forceY").strength(0)
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
    sidebarToClear.style("display", "block")
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
        // setExploreTOC(sideBarLeftContent, selectedArticle) 
        setArticleDomainDetails(sideBarLeftContent, selectedArticle);
        // setArticleDetails(sideBarLeftContent, selectedArticle)
    }
}

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
        .transition().duration(200).style('opacity',1)
    
    let titleDisplay;
    if (titleType === 'Main') { titleDisplay = selectedArticle.title + ' (Main)' }
    if (titleType === 'Preview') {titleDisplay = selectedArticle.title + ' (Preview)' }
    if (titleType === 'Explore') {titleDisplay = selectedArticle.title + ' (Explore)' }

    introParagraphPanel.append("h2")
        .text(titleDisplay)
        .classed('panelHeading', true)
        .style('color', function() {return color(selectedArticle.primary_domain)})
        
    let paragraphDiv = introParagraphPanel.append("div")
    let paragraphData = getParagraphDataHTML(selectedArticle.preamble_text);

    paragraphDiv
        .html(paragraphData)
        .classed('panelParagraphText', true)

    if ( titleType !== 'Preview') {
        let sepURL = baseURL + selectedArticle.id

        introParagraphPanel.append("p")
            .html(`<a href="${sepURL}" target="_blank">Read the full article at SEP</a>`)
            .classed('sepLink', true)

    }



  

    
}

function getParagraphDataHTML(paragraphDataFromNode) {
    let htmlReturn = '';
    //only display the first 500 characters of the node's intro paragraph
    if(typeof(paragraphDataFromNode)!=='undefined') {
        if(paragraphDataFromNode !== '') {
            if (paragraphDataFromNode.length > 500 ) {
                // console.log(paragraphDataFromNode)
                let paragraph550 = paragraphDataFromNode.substring(0,550)
                
                let firstPeriod = paragraphDataFromNode.indexOf('.',350) + 1
                let firstQuestionMark = paragraphDataFromNode.indexOf('?',350) + 1
                let firstSemicolon  = paragraphDataFromNode.indexOf(';',350) + 1
                let lastSpace = paragraphDataFromNode.indexOf(' ',450)
                let finalParaText;

                if(firstPeriod <= 550 ) { finalParaText = paragraphDataFromNode.substring(0,firstPeriod) }
                if(firstPeriod > 550 && firstQuestionMark <= 550 ) { finalParaText = paragraphDataFromNode.substring(0,firstQuestionMark) }
                if(firstPeriod > 550 && firstSemicolon <= 550 ) { finalParaText = paragraphDataFromNode.substring(0,firstSemicolon) }
                if(firstPeriod > 550 && firstQuestionMark > 550 ) { finalParaText = paragraphDataFromNode.substring(0,lastSpace) + ' ...'}
                if(firstPeriod === 0 && (firstQuestionMark === 0 || firstSemicolon === 0)) {finalParaText = paragraphDataFromNode.substring(0,500) + '...'}

                if(typeof(finalParaText)==='undefined') {
                    finalParaText = paragraphDataFromNode.substring(0,500) + '...' 
                }
                let displayCut = `(First ${finalParaText.length} characters displayed.)`;

                htmlReturn = '<p>' + finalParaText + '</p>' 
                            //     + 
                            //  '<p class="panelDispayCut float-right">' + displayCut + '</p>'
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

    let domainListHeading = domainListDiv.append("h2")
        .text('Domains')
        .attr('id', 'domainListHeading')
        .classed('panelHeading', true)
        // .classed('toggleOnBG', true)

    let domainListContentArea = domainListDiv.append('div')
        .attr('id','domainListContentArea')
        .style('display', 'block')

    domainListContentArea.append("ul")
        .selectAll(".domainListItem")
        .data(selectedArticle.domain_tags.split(','))
            .enter()
            .append('li')
            .html(function(d) {return d})
            .style("color", function(d) {return color(d)})
            .classed('domainListItem', true)
            .classed('panelListItem', true)
        .exit().remove()

    // domainListContentArea.append('p')
    //     .html('(Dbl-Click for Domain Graph)')
    //     .classed('panelDispayCut', true)
    //     .classed('float-right', true)



    let domainList = d3.selectAll('.domainListItem')
    
    domainList
        .on('mouseover', function() { activateItemLink(this)})
        .on('mouseout', function() { deActivateItemLink(this)})
        .on('click', function () {
            let domainTitle = d3.select(this).datum()
            showDomainGraph(domainTitle)
    })

}

function toggleDomainDetailsContent(state) {
    let domainDetailsContentArea = d3.select('#domainListContentArea')
    let domainDetailsHeading = d3.select('#domainListHeading')
    if(state === 'on') {
        domainDetailsContentArea.style('display', 'block')
        toggleExploreTOCArea('off')
    }   else  if (state === 'off')   {
        domainDetailsContentArea.style('display', 'none')
    }

    window.getSelection().removeAllRanges();

}

function setArticleDetails(parentSidebar, selectedArticle) {
    let additionalDetailsDiv = parentSidebar.append('div')
        .classed('panelBG', true)

    let detailsHeading = additionalDetailsDiv.append("h2")
        .text('Details')
        .attr('id', 'articleDetailsHeading')
        .classed('panelHeading', true)
        // .classed('toggleOnBG', true)

    let detailsListDiv = additionalDetailsDiv.append('div')
        .attr('id','detailsContentArea')
        .style('display', 'block')
    
    detailsData = [
        `<td>Author(s):</td><td>${selectedArticle.author}</td>`,
        `<td>Pub&nbsp;Date:</td><td> ${selectedArticle.pubdate}</td>`,
        `<td>Word&nbsp;Count:</td><td> ${selectedArticle.word_count}</td>`]

    let detailsTable = detailsListDiv.append('table')
        .classed('table', true)
        .classed('table-sm', true)
        .classed('table-borderless',true)
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
}

function toggleArticleDetailsContent(state) {
    let detailsContentArea = d3.select('#detailsContentArea')
    let articleDetailsHeading = d3.select('#articleDetailsHeading')

    if(state === 'on') {
        detailsContentArea.style('display', 'block')
        toggleExploreTOCArea('off')
    }   else  if (state === 'off')   {
        detailsContentArea.style('display', 'none')
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

function toggleExploreTOCArea(state){
    let exploreTOCHeading = d3.select("#exploreTOCHeading")
    let exploreTOCContentArea = d3.select("#exploreTOCContentArea")

    if(state==='on') {
        exploreTOCContentArea.style('display', 'block')
        exploreTOCHeading
            .classed('toggleOnBG_User', true)
            .classed('toggleOffBG_User', false)
    }   else if(state==='off') {
        exploreTOCContentArea.style('display', 'none')
        exploreTOCHeading
            .classed('toggleOnBG_User', false)
            .classed('toggleOffBG_User', true)
    }


    window.getSelection().removeAllRanges();

}

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

   let articleListHeading = articleListDiv.append("h2")
    .text("List of Articles")
    .attr('id', 'articleListHeading')
    .classed('panelHeading', true)
    .classed('toggleOffBG_User', true)


   let articleListContentArea = articleListDiv.append("div")
       .attr("id", "articleListContentArea")
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

   // setup UI interactions
   let listArticleLinks = d3.selectAll('.linkArticlesListItem');
   let centralNode = graphNodes[0];

   listArticleLinks
       .on('mouseover', function() { mouseOverArticleNode(this, data, 'opacity')})
       .on('mouseout', function()  { mouseOutArticleNode(this, data)})
       .on('click', function()  { sngClickArticleNode(this, data, 'opacity')})
       .on('dblclick', function()  { dblClickArticleNode(this)})

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

    if (state==='on') {
        articleListContentArea.transition().duration(200).style('display', 'block')
        articleListHeading
            .classed('toggleOnBG_User', true)
            .classed('toggleOffBG_User', false)
    }   else if(state==='off') {
        articleListContentArea.transition().duration(200).style('display', 'none')
        articleListHeading
            .classed('toggleOnBG_User', false)
            .classed('toggleOffBG_User', true)
    }

    window.getSelection().removeAllRanges();
}

function setLinkDirectionPanel(parentDiv, articleData) {

    let linkDirectionPanel = parentDiv.append("div")
        .classed('panelBG', true)

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

    let listLinkDirection = d3.selectAll('.linkDirListItem')
    listLinkDirection
        .on('mouseover', function() {
            activateItemLink(this)
            if(!exploreMode) { displayLinkDirectionArticles(this, articleData) }

        })
        .on('mouseout', function() {
            deActivateItemLink(this)
            if(!exploreMode) {resetDisplayDefaultsArticleGraph();}

            
        })

        .on('click', function() {
            activateItemLink(this)
            displayLinkDirectionArticles(this, articleData)
            activateLinkDirDomItem('.linkDirListItem',this)
            activateLinkDirDomItem('.linkDomainListItem',this)
            setGraphMode('Click')
        })

}

function activateLinkDirDomItem(itemClass, mouseReference) {

    d3.selectAll(itemClass).each(function (d,i) {
        if(mouseReference === this) {
            d3.select(this)
                .style('font-weight', 'bold')
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

    let linkDomainHeading = linkDomainPanel.append('h2')
        .text('Link Domains')
        .attr('id', 'linkDomainHeading')
        .classed('panelHeading', true)

    let linkDomainContentArea = linkDomainPanel.append('div')
        .attr('id', "linkDomainContentArea")
        .attr("display", "block")
    
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

    let listlinkDomains = d3.selectAll('.linkDomainListItem')
    listlinkDomains
        .on('mouseover', function() {
            activateItemLink(this)
            let linkDomainArray = getDomainLinksInArticle(d3.select(this).datum())
            if(!exploreMode) { focusOnLinkAnalysis(linkDomainArray) }
            
        })
        .on('mouseout', function() {
            deActivateItemLink(this);
            if(!exploreMode) { resetDisplayDefaultsArticleGraph(); }
        })
        .on('click', function() {
            activateItemLink(this)
            let linkDomainArray = getDomainLinksInArticle(d3.select(this).datum())
            focusOnLinkAnalysis(linkDomainArray) 
            activateLinkDirDomItem('.linkDirListItem',this)
            activateLinkDirDomItem('.linkDomainListItem',this)
            setGraphMode('Click')
            
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

function dblClickArticleNode(dblClickReference) {
    
    // get node or label activated
    let activeElement = d3.select(dblClickReference)

    if (activeElement.datum().index !== 0) {
    // do the following if the activated node or label was not the central node

        activeElement.style('cursor', 'pointer'); 
        resetDisplayDefaultsArticleGraph();
        let articleTitle = activeElement.datum().title
        showArticleGraph(articleTitle)
    }
}

function sngClickArticleNode(sngClickReference, data, opacityTest) {
       // get node or label activated
       let activeElement = d3.select(sngClickReference)

       if (activeElement.datum().index !== 0  && activeElement.style(opacityTest) > .4) {
               // do the following if the activated node or label was not the central node
               activateItemLink(sngClickReference)
               let relatedArticles = getRelatedArticles(data,activeElement.datum())
               focusOnArticleNode(data, activeElement.datum())
               updateSideBarLeft_ArticleMain(activeElement.datum(), 'Explore')
               resetListItemDefaults('.linkDirListItem')
               resetListItemDefaults('.linkDomainListItem')
               setGraphMode('Click')
       } 
}
function mouseOverArticleNode(mouseOverReference, data, opacityTest) {
    
    // get node or label activated
    let activeElement = d3.select(mouseOverReference)

    if (activeElement.datum().index !== 0  && activeElement.style(opacityTest) > .7) {
            // do the following if the activated node or label was not the central node
            activateItemLink(mouseOverReference)
            let relatedArticles = getRelatedArticles(data,activeElement.datum())

            if (!exploreMode) {  focusOnArticleNode(data, activeElement.datum()) }
            updateSideBarLeft_ArticleMain(activeElement.datum(), 'Preview')
    }

}
function mouseOutArticleNode(mouseOverReference, data) {
    let activeElement = d3.select(mouseOverReference)
    let centralNode = graphNodes[0]
    
    deActivateItemLink(mouseOverReference)
    
    if (!exploreMode) { resetDisplayDefaultsArticleGraph();}
    updateSideBarLeft_ArticleMain(centralNode, 'Main')

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

    // reduce link opacity for all non-activated links
    d3.selectAll('.link').
        each(function (d,i) {
            d3.select(this)
                .transition().duration(200).attr('opacity', function (link) { 
                    return link.target.id === activeElement.id ? styConfig.link.activeOpacity : styConfig.link.inactiveOpacity
                })
    });

    d3.selectAll('.label')
        .each(function (d,i) {
            d3.select(this)
                .transition().duration(200).attr('fill-opacity', function(label) { return setNodeLabelOpacity(label, relatedArticleIDs, activeElement)})
        })
        
    d3.selectAll('.node')
        .each(function (d,i) {
            d3.select(this)
            .transition().duration(200).style('opacity', function(node) { return setNodeLabelOpacity(node, relatedArticleIDs, activeElement)})
    })

    activateArticleListItem();


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

        d3.selectAll('.relatedLinkLines').transition().duration(100).style('opacity',styConfig.linkLines.inactiveOpacity)
    }

    activateArticleListItem();

}

function activateArticleListItem() {
    let activeNodes = d3.selectAll('.label').filter(function (d,i) {  return d3.select(this).style('fill-opacity') > 0.5})
    
    //adjust opacity for titles in List of Articles
    let nodeTitles = activeNodes.data().map(node => node.title)
    let listOfArticles = d3.selectAll('.linkArticlesListItem')
    listOfArticles.each(function (d) {
        let articleRef = this
        if(nodeTitles.includes(d.title)) {
            d3.select(articleRef)
                .transition().duration(200).style('opacity', styConfig.listItems.defaultOpacity)
        }   else    {
            d3.select(articleRef)
                .transition().duration(200).style('opacity', styConfig.listItems.dimmedOpacity)
        }
    })

    //adjust opacity for domains in Link Domains
    let nodeDomains = activeNodes.data().map(node => node.primary_domain)
    let linkDomains = d3.selectAll('.linkDomainListItem')

    linkDomains.each(function (d) {

        let articleRef = this
        // if(nodeDomains.includes(d.title)) {
        //     d3.select(articleRef).transition().duration(200).style('opacity', styConfig.listItems.defaultOpacity)
        // }   else    {
        //     d3.select(articleRef).transition().duration(200).style('opacity', styConfig.listItems.dimmedOpacity)
        // }
    })


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

function resetListItemDefaults(itemClass) {
    d3.selectAll(itemClass)
        .transition().duration(200).style('opacity',styConfig.listItems.defaultOpacity)
        .style('font-weight', 'normal')
}
   

function resetDisplayDefaultsArticleGraph() {
    d3.selectAll('.link').transition().duration(200).attr('opacity', styConfig.link.defaultOpacity);
    d3.selectAll('.label').transition().duration(200).attr('fill-opacity', styConfig.nodeLabel.defaultOpacity);
    d3.selectAll('.node').transition().duration(200).style('opacity', styConfig.nodeLabel.defaultOpacity);
    d3.selectAll('.relatedLinkLines').transition().duration(200).style('opacity',styConfig.linkLines.inactiveOpacity)
    d3.select('.d3plus-textBox').transition().duration(200).style('opacity',styConfig.nodeLabel.defaultOpacity)

    resetListItemDefaults('.linkDirListItem')
    resetListItemDefaults('.linkDomainListItem')
    resetListItemDefaults('.linkArticlesListItem')

} 

// ****** DOMAIN GRAPH FUNCTIONS ****** 

function showDomainGraph(domainTitle) {

    d3.json(json_file).then(function(data) {
        showGraphPage();
        let domainData = getDomainData(data,domainTitle)
        setGlobalNodesLinks(domainData)
        drawDomainSimulation(data, domainData)
        updateSidebarLeft_DomainMain(data, domainData);
        updateSidebarRight_DomainMain(data, domainData);
        updateNeighborNodes();
        setPageTitle(domainTitle, domainTitle)
        window.getSelection().removeAllRanges();
        updateRecentSearch({'title': domainTitle, 'primary_domain': domainTitle},'Domain');
        resetDisplayDefaultsArticleGraph();
        resetDisplayDefaultsDomainGraph();
        setGraphMode('Hover')
        setGraphType('Domain')

        showAll = false;

        d3.selectAll('.label').remove();
        d3.select('.mainArticleLabelArea').remove();



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
            if (numTicks < 100 ) {

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
    simConfig.simulation.force("forceX").strength(function (d) { return (countOfNodes > 300) ? 0.1 : 0.07 })
    simConfig.simulation.force("forceY").strength(function (d) { return (countOfNodes > 300) ? 0.1 : 0.07 })
    simConfig.simulation.nodes(graphNodes);
    simConfig.simulation.force("collide").radius(15)
    simConfig.simulation.alpha(1).restart();

}

function setLinkDistanceDomain(countofNodes) {

}
function updateSidebarsDomain(data, domainTitle) {
    updateSidebarLeft_DomainMain()
    updateSidebarRight_DomainMain(data, domainTitle);
}

 function updateSidebarLeft_DomainMain(selectedDomainArticle){

        clearSidebar(sidebarLeft)

        let sideBarLeftContent = sidebarLeft.append("div")

        if (typeof(selectedDomainArticle.title) !== 'undefined') {
            setArticleIntroParagraph(sideBarLeftContent,"Preview", selectedDomainArticle)
            setArticleDomainDetails(sideBarLeftContent,selectedDomainArticle)

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

function setDomainIntroPanel(parentSidebar, domainData) {
    let domainIntroPanel = parentSidebar.append("div")
    domainIntroPanel
        .classed('panelBG', true)
        .style('margin-bottom', '2em')

    domainIntroPanel.append("h2")
    .text("Domain Introduction")
        .classed('panelHeading', true)

    domainIntroPanel.append("p")
        .text("Domain Text to follow")
        .classed('panelParagraphText', true)
}

function setDomainCountPanel(parentDiv, domainData, data) {
    let domainCountPanel = parentDiv.append("div")
        .classed("panelBG", true)  
        .classed("linkCountDiv", true)

    domainCountPanel.append("h2")
        .html(`<span class="badge badge-pill badge-light">${domainData.nodes.length}</span> Domain Articles`)
        .classed('linkCountText', true)
}
function setCentralNodesPanel(parentSidebar, domainData, data) {

    let centralNodesDiv = parentSidebar.append("div")
        .classed('panelBG', true)

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
            

    let centralNodesList = d3.selectAll('.centralNodeArticles')
    centralNodesList.on('mouseover', function() { mouseOverDomainNode(this, data, domainData)})
    centralNodesList.on('mouseout', function() { mouseOutDomainNode(this, data, domainData)})
    centralNodesList.on('click', function() { sngClickDomainNode(this, data, domainData)})
    centralNodesList.on('dblclick', function() { dblClickDomainNode(this, data)})

}

function setDomainArticleListPanel(parentSidebar, domainData, data) {
    // create domain article list div
    let domainArticleListDiv = parentSidebar.append("div")

    domainArticleListDiv
        .classed('panelBG', true)

    domainArticleListDiv.append("h2")
        .text("List of All Domain Articles")
        .classed('panelHeading', true)

    let articleListAreaDiv = domainArticleListDiv.append('div')
        .classed("domainArticleList", true)
        .attr('id','domainArticleListContentArea')

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

    ////// ux/ui interactions

    let domainArticleList = d3.selectAll('.domainArticle')
    
    domainArticleList.on('mouseover', function() {mouseOverDomainNode(this, data, domainData)})
    domainArticleList.on('mouseout', function() {mouseOutDomainNode(this, data, domainData)})
    domainArticleList.on('click', function() { sngClickDomainNode(this, data, domainData)})
    domainArticleList.on('dblclick', function() {dblClickDomainNode(this, data)})

}

function previewDomainNode(mouseOverReference, data, domainTitle) {
    currentDomainCentralNode = getDomainCentralNode()

    let selectedArticle = d3.select(mouseOverReference)
        .classed('domainMainNode', true)

    focusOnDomainArticle(selectedArticle.datum());
    updateSideBarLeft_ArticleMain(selectedArticle.datum(), 'Preview')
    
}

function exploreDomainNode(domainNode) {

    focusOnDomainArticle(domainNode.datum());
    updateSideBarLeft_ArticleMain(domainNode.datum(), 'Explore')

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
        .classed('domainMainNode', true)

    focusOnDomainArticle(selectedArticle.datum());
    updateSideBarLeft_ArticleMain(selectedArticle.datum(), 'Explore')

    currentDomainCentralNode = getDomainCentralNode()
    setListItemStyle_DomainCentralNode(currentDomainCentralNode)
    setListItemStyle_NeighborNodeOpacity()
    // exploreMode = true
    setGraphMode('Click')

        
}
function mouseOverDomainNode(mouseOverReference, data, domainTitle) {
    
    let selectedNode = d3.select(mouseOverReference).datum()

    if(!exploreMode) { activateItemLink(mouseOverReference); previewDomainNode(mouseOverReference, data, domainTitle) }
    if(exploreMode) {
        currentDomainCentralNode = getDomainCentralNode()
        let selectedNode = d3.select(mouseOverReference).datum()
        let nodeCircle = d3.selectAll('.node').filter(function (d,i) { return d.id === selectedNode.id })


        if(+nodeCircle.style('opacity') >= styConfig.nodeLabel.neighborNodeOpacity) {
            activateItemLink(mouseOverReference)
            updateSideBarLeft_ArticleMain(selectedNode, 'Preview')
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

    if(!exploreMode) { clearSidebar(sidebarLeft); resetDisplayDefaultsDomainGraph();} 
    if(exploreMode) { 
        let selectedNode = d3.select(mouseOutReference).datum()
        d3.selectAll('.relatedLinkLines').style('opacity',styConfig.linkLines.inactiveOpacity)
        if(typeof(currentDomainCentralNode.title) !== null ) {
            if(selectedNode.title !== currentDomainCentralNode.title) { 
                if(priorNodeCircle_ListItem) { priorNodeCircle_ListItem.style('opacity', styConfig.nodeLabel.neighborNodeOpacity) }
                 }
                //  updateSidebarLeft_DomainMain(currentDomainCentralNode)
                 updateSideBarLeft_ArticleMain(currentDomainCentralNode, 'Explore')
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
        .x(-450)
        .fontFamily('proxima-nova, sans-serif')
        .fontSize(13)
        .fontColor(function(d) {return color(d.primaryDomain)})
        .verticalAlign('top')
        .textAnchor('start')
        .width(325)
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
        .x(155)
        .textAnchor('end')
        .fontFamily('proxima-nova, sans-serif')
        .fontSize(13)
        .fontColor(function(d) {return color(d.primaryDomain)})
        .verticalAlign('top')
        .width(325)
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
            
            // updateSidebarLeft_DomainMain(selectedNode)
            updateSideBarLeft_ArticleMain(selectedNode, 'Preview')

            priorNodeCircle = nodeCircle
        }

        function mouseOutTextBox(mouseOutReference) {
            deActivateItemLink(mouseOutReference)

            let selectedNode = getDomainNodeFromD3Plus(mouseOutReference)

            d3.selectAll('.relatedLinkLines').style('opacity',0)

            if(selectedNode.title !== currentDomainCentralNode.title) { priorNodeCircle.style('opacity', styConfig.nodeLabel.neighborNodeOpacity) }

            updateSideBarLeft_ArticleMain(currentDomainCentralNode, 'Explore')
        }

        let isDblClick = false;
        function sngClickTextBox(mouseClickReference) {
            d3.selectAll('.relatedLinkLines').style('opacity',0)
            let selectedNode = getDomainNodeFromD3Plus(mouseClickReference)
            setTimeout(function() { 
                if(!isDblClick) {
                    focusOnDomainArticle(selectedNode);
                    updateSideBarLeft_ArticleMain(selectedNode, 'Explore')
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
    if (arrayLength > 30 ) {cyMin = -300; cyMax = 300}

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
    let widthOffset = 300
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

    if(graphType==='Domain') {clearSidebar(sidebarLeft)}
    

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

        case 'Latin American Philosophy':
            rgbValue = 'rgb(237, 100, 68)' //#FFCB56
            break;

        case 'Arabic and Islamic Philosophy':
            rgbValue = 'rgb(255, 128, 0)' //#FFC007
            break;

        case 'African and African-American Philosophy':
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
            rgbValue = 'rgb(255,255,255)'
            break;
    }
    return rgbValue
}

function getRandom() {
    let randomEntry  = getRandomIntInclusive(0,allEntries.length)
    if (randomEntry <= numArticles-1) {
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
