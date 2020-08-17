// ****** Global Variables ******

// Select Page Elements
let svg = d3.select('#mainGraph')
let articleMenu = d3.select('#articleSearchMenu')
let domainMenu = d3.select('#domainSearchMenu')
let introDiv = d3.select('#intro') 
let articleGraphDiv = d3.select('#articleGraph')
let sidebarLeft = d3.select("#sidebarLeft") 
let sidebarRight = d3.select("#sidebarRight")
let getRandomEntry = d3.select("#getRandomEntry")
let recentSearchMenu = d3.select("#recentSearchMenu")
let graphMode = d3.select("#graphMode")
let graphInstructions = d3.select("#graphInstructions")

//Initialize nodes and links arrays for simulation
let graphNodes = [];
let graphLinks = [];
let allEntries = [];


// Initialize SVG and Simulation
let svgConfig = initializeParentSVG(svg);
let simulationConfig = initializeSimulation(svgConfig);  
let stylesConfig = initializeStyles();

//Initialze searchCache and recentSearches
let searchCache = [];
let recentSearches = [];

// graph helpers
let neighborNodes = [];
let linkAngles = [];
let exploreMode = false;
let priorNodeCircle;
let priorNodeCircle_ListItem;
let currentDomainCentralNode;

//transition change
let t = d3.transition()
    .duration(300)
    .ease(d3.easeLinear);

//set BaseURL for SEP Edition
let sepEdition = "Summer 2020"
let baseURL = 'https://plato.stanford.edu/archives/sum2020';

let json_file = 'static/sep_network_new.json'

let testLabel = d3.select('#testLabel')


startVisualization();

function startVisualization() {
    
    loadMenus();
    showArticleGraphAreas() 
    // showHomeMenu(data, simulationConfig)
    setGraphMode('Preview')

    //UI Response features
    articleMenu.on('change', function(){
        let articleTitle = d3.event.target.value;
        if (articleTitle !== "[Search articles...]") { showArticleGraph(articleTitle)}
        showArticleGraph(articleTitle)
        window.getSelection().removeAllRanges();

    })

    domainMenu.on('change', function(){
        let domainTitle = d3.event.target.value;
        if (domainTitle !== "[Search domains...]") { showDomainGraph(domainTitle)}
        
    })

    getRandomEntry.on('click', function() { getRandom() })

    recentSearchMenu.on('change', function() {
        searchItem = d3.event.target.value;

        if(searchItem !== 'Recent Searches...') {
        domainPosition = searchItem.indexOf(' (domain)');
            if( domainPosition === -1) {
                showArticleGraph(searchItem)
            }   else    {
                showDomainGraph(searchItem.substring(0,domainPosition))
                console.log(searchItem.substring(0,domainPosition))
            }
        }
    })

    graphMode
        .on('mouseover', function() {activateItemLink(this,'bold')})
        .on('mouseout', function() {deActivateItemLink(this, 'normal')})
        .on('click', function() {toggleGraphMode();})

    graphInstructions
        .on('mouseover', function() {activateItemLink(this, 'bold')})
        .on('mouseout', function() {deActivateItemLink(this, 'normal')})
        .on('click', function() {displayGraphInstructions()})



}

// ****** SET GLOBALS  ********

function setGlobalNodesLinks(sepData) {
    //clear out whatever is in the global graphNodes and graphLinks arrays
    graphNodes.length = 0
    graphLinks.length = 0

    //push new nodes and links objects into globals
    sepData.nodes.forEach(node => graphNodes.push(node))
    sepData.links.forEach(link => graphLinks.push(link))

}

// ****** INITIALIZATION FUNCTIONS ********

function initializeParentSVG(svg) {
    // set basic SVG Config data 
    let margin = {
        top: 0,
        right: 0,
        bottom:0,
        left:0
    };

    let areaWidth = 730;
    let areaHeight = 730;

    let width = areaWidth - margin.left - margin.right;
    let height = areaHeight - margin.top - margin.bottom;

    svg.attr("viewBox", "0 0 " + width + " " + height )
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
        .force("charge", d3.forceManyBody())
        .force("link", d3.forceLink())
        .force("center", d3.forceCenter())
        .force("forceX", d3.forceX())
        .force("forceY", d3.forceY())
        .force("collide", d3.forceCollide())
        .alphaDecay(.05)
        .alphaMin(.1)
        // .alphaTarget(.9);

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
        'fontSize': '1em', 
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
        'dimmedOpacity': 0.51
    }

    return {link, nodeLabel, linkLines, listItems}


}
// ****** MENU FUNCTIONS ********

function loadMenus() {
    d3.json(json_file).then((json) => {
        //build article menu 
        let articleItems = ["[Search articles...]"]
        json.articles.nodes.forEach(node => {
            articleItems.push(node.title)
            allEntries.push(node.title)
        })

        articleMenu.selectAll("option")
        .data(articleItems)
        .enter().append("option")
                .attr("value", (d) => d)
                .html((d) => d)

        //build domain menu
        let domainSet = new Set()
        json.articles.nodes.forEach(node => {
            domainSet.add(node.primary_domain)
        })
        let domainItems = Array.from(domainSet)
        domainItems.sort((a,b) => d3.ascending(a, b));
        domainItems.forEach(node => allEntries.push(node))
        domainItems.unshift("[Search domains...]")
        domainMenu.selectAll("option")
            .data(domainItems)
            .enter().append("option")
                    .attr("value", (d) => d)
                    .html((d) => d)

    })


}

function showHomeMenu(data, simulationConfig) {
    sep_node = data.domains.nodes
    sep_node.forEach(node => nodes.push(node))
    sep_node[0].links.forEach(link => links.push(link))
    drawArticleSimulation(data, simulationConfig)

}

function showArticleGraphAreas() {
    introDiv.style('display', 'none')
    articleGraphDiv.style('display', 'block')
    graphInstructions.style('display', 'block')
    graphMode.style('display', 'block')
}

function updateRecentSearch(searchObj) {
    
    recentSearches.shift();

    if(!recentSearches.includes(searchObj)) { 

        let entryTitle;
        if (searchObj.article) { entryTitle = searchObj.article}
        if (searchObj.domain) {entryTitle = searchObj.domain + ' (domain)'}
        if (!recentSearches.includes(entryTitle)) {
            if (recentSearches.length < 11) {
                recentSearches.push(entryTitle)
            }   else { 
                recentSearches.pop()
                recentSearches.push(entryTitle)
            }
        }

        recentSearches.unshift(['Recent Searches...']);

        recentSearchMenu.html("")

        recentSearchMenu.selectAll(".recentSearch")
            .data(recentSearches)
            .enter().append('option')
                .text((d)=> d)
                .classed('recentSearch', true)
    }

}

function setGraphMode(mode) {
    if(mode==='Preview') {
        exploreMode = false; 
        graphMode.text('Graph Mode: Mouseover/Preview'); 
        resetDomainMenuOpacity();
        resetDisplayDefaultsDomainGraph();
        resetDisplayDefaultsArticleGraph();
  }
    if(mode==='Explore') {
        exploreMode = true;
        graphMode.text('Graph Mode: Single Click/Explore'); 

    }
}

function setGraphInstructions(mode) {
    if(mode==='Article') {graphInstructions.text('Article Graph Instructions'); }
    if(mode==='Domain') {graphInstructions.text('Domain Graph Instructions');}
}

function displayGraphInstructions() {
    let instructionText = graphInstructions.text()
    if(instructionText.indexOf('Article') === 0 ) { 
        displayGraphInstructions_Article()
    }   else {
        displayGraphInstructions_Domain()
    }
}

function displayGraphInstructions_Article() {
    console.log('display article graph instructions')
}

function displayGraphInstructions_Domain() {
    console.log('display domain graph instructions')
}


function toggleGraphMode() {
    if(exploreMode) {
        setGraphMode('Preview')
    } else {
        setGraphMode('Explore')
    }

    window.getSelection().removeAllRanges();
}
// ****** ARTICLE GRAPH DATA AND SIMULATION FUNCTIONS ****** 

function setArticleMenuTitle(articleTitle) {
    articleMenu.property("value", articleTitle)

    if(articleTitle === '[Search articles...]') {
        articleMenu
            .classed('menuBorderOn', false)
            .classed('menuBorderOff', true)
    }   else {
        articleMenu
            .classed('menuBorderOn', true)
            .classed('menuBorderOff', false)
    }
    

}
function setArticleGraphTitle(selectedArticle) {
    let selectedArticleTitle = d3.select("#selectedEntryTitle").select("h1")
    selectedArticleTitle
        .text(selectedArticle.article)
        .style("color", function(d) {return color(selectedArticle.nodes[0].primary_domain)})
        .classed('selectedEntryTitle',true)

}
function showArticleGraph(articleTitle) {
    d3.json(json_file).then((json) => {
        let articleData = getArticleData(json,articleTitle)
        setGlobalNodesLinks(articleData)
        let articleNode = graphNodes[0]
        drawArticleSimulation(json)
        setArticleGraphTitle(articleData)
        setArticleMenuTitle('[Search articles...]')
        setDomainMenuTitle('[Search domains...]')
        updateRecentSearch(articleData);
        d3.select('.mainDomainNode').remove();
        setGraphMode('Preview')
        setGraphInstructions('Article')
        resetDisplayDefaultsDomainGraph();
        resetDisplayDefaultsArticleGraph();
        updateSidebarsArticle(json, articleNode);

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
                        "linkDomains": linkDomains }
    
    //add to cache
    searchCache.push(articleData)

    return articleData

}
function drawArticleSimulation(data) { 

    let centralNode = graphNodes[0];
    let countOfNodes = graphNodes.length;
    let transitionTime = 2000;

    //links
    link = simulationConfig.links.selectAll('.link')
                         .data(graphLinks, function(d) {return `${d.source}-${d.target}`})
                         .order()
                         .attr('dir', function(d) {return d.dir})
                         .attr('target', function(d) { return d.target })

    link.exit().remove();

    link = link.enter()
               .append('line')
               .attr("stroke", stylesConfig.link.strokeColor)
               .attr("stroke-width", stylesConfig.link.strokeWidth)
               .attr("opacity", stylesConfig.link.defaultOpacity)
               .attr('dir', function(d) {return d.dir})
               .attr('nodeID', function(d) { return d.target })
               .classed('link',true).merge(link)

    //labels
    label = simulationConfig.labels.selectAll('.label')
                           .data(graphNodes, function(d) {return d.title})
                           .attr('fill-opacity',stylesConfig.nodeLabel.defaultOpacity)
                           .order()
                           .classed('mainArticleLabel', function(d,i) {return i===0?true:false})
                           .attr("fill", function(d) {return color(d.primary_domain)})
    label.exit().remove();

    label = label.enter()
                 .append("text")
                 .text(function(d) {return d.title})
                 .attr('fill-opacity',stylesConfig.nodeLabel.defaultOpacity)
                 .attr("font-size", stylesConfig.nodeLabel.fontSize)
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
    node = simulationConfig.nodes.selectAll('.node')
                         .data(graphNodes, function (d) {return d.id})
                         .order()
                         .attr("r", 5)
                         .attr("fill", function(d) {return color(d.primary_domain)})
                         .classed('mainArticleNode', function(d,i) {return i===0?true:false})
    
    node.exit().remove()

    node = node.enter()
                .append('circle')
                .attr("r", stylesConfig.nodeLabel.defaultRadius)
                .attr("fill", function(d) {return color(d.primary_domain)})
                .attr("stroke", stylesConfig.nodeLabel.strokeColor)
                .attr("stroke-width", stylesConfig.nodeLabel.strokeWidth)
                .attr('nodeID', function(d) {return d.id})
                .style('opacity',stylesConfig.nodeLabel.defaultOpacity)
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
    let ticksCompleted = false;
    simulationConfig.simulation.on('tick', function (){
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

    })

    //update simulations
    simulationConfig.simulation.nodes(graphNodes);
    simulationConfig.simulation.force("charge")
        .strength(function() { return forceStrength(countOfNodes)})
    simulationConfig.simulation.force("link")
        .id(function (d) {return d.id})
        .distance(function (d) {return (countOfNodes > 50) ? 200 : 175})
    simulationConfig.simulation.force("link").links(graphLinks)
    simulationConfig.simulation.force("forceX").strength(0)
    simulationConfig.simulation.force("forceY").strength(0)
    simulationConfig.simulation.force("collide").radius(0)
    simulationConfig.simulation.alpha(1).restart();

    setArticleGraphMainLabel()



}

function setArticleGraphMainLabel() {
        //style main article node   

        let mainArticleTitle = d3.select('.mainArticleLabel').datum()
        let currentMainArticleNode = [{'text': mainArticleTitle.title, 'primaryDomain': mainArticleTitle.primary_domain}]
        

        let mainArticleLabelArea = simulationConfig.labels.append('g')
            .classed('mainArticleLabelArea', true)

        mainArticleLabelArea.html('')

        mainArticleLabelArea
            .style('display', 'block')




    let mainNodeMaxWidth = 250 

    new d3plus.TextBox()
        .data(currentMainArticleNode)
        .select('.mainArticleLabelArea')
        .y(-15)
        .x(-75)
        .fontFamily('proxima-nova, sans-serif')
        .fontSize(18)
        .fontColor(function(d) {return color(d.primaryDomain)})
        .verticalAlign('top')
        .textAnchor('middle')
        .width(150)
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
        setExploreTOC(sideBarLeftContent, selectedArticle) 
        setArticleDomainDetails(sideBarLeftContent, selectedArticle);
        setArticleDetails(sideBarLeftContent, selectedArticle)
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
                let firstPeriod = paragraphDataFromNode.indexOf('.',350) + 1
                let firstQuestionMark = paragraphDataFromNode.indexOf('.',350) + 1
                let lastSpace = paragraphDataFromNode.indexOf(' ',450)
                let finalParaText;

                if(firstPeriod <= 550 ) { finalParaText = paragraphDataFromNode.substring(0,firstPeriod) }
                if(firstPeriod > 550 && firstQuestionMark <= 550 ) { finalParaText = paragraphDataFromNode.substring(0,firstQuestionMark) }
                if(firstPeriod > 550 && firstQuestionMark > 550 ) { finalParaText = paragraphDataFromNode.substring(0,lastSpace) + ' ...'}

                if(typeof(finalParaText)==='undefined') {
                    finalParaText = paragraphDataFromNode.substring(0,500) + '...' 
                }
                let displayCut = `(First ${finalParaText.length} characters displayed.)`;
                htmlReturn = '<p>' + finalParaText + '</p>' + 
                             '<p class="panelDispayCut float-right">' + displayCut + '</p>'
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

    domainListContentArea.append('p')
        .html('(Dbl-Click for<br>Domain Graph)&nbsp;')
        .classed('panelDispayCut', true)
        .classed('float-right', true)
        .style('margin-top','-.5em')
        .style('margin-left', '-.9em')

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



    let domainList = d3.selectAll('.domainListItem')
    
    domainList
        .on('mouseover', function() { activateItemLink(this)})
        .on('mouseout', function() { deActivateItemLink(this)})
        .on('dblclick', function () {
            let domainTitle = d3.select(this).datum()
            showDomainGraph(domainTitle)
    })

    // //ux/ui interactions
    // domainListHeading
    //     .on('mouseover', function() {activateItemLink(this)})
    //     .on('mouseout', function() { deActivateItemLink(this)})
    //     .on('dblclick', function() { 
    //         let currentState = domainListContentArea.style('display')

    //         if(currentState === 'block') {
    //             toggleDomainDetailsContent('off')
    //         }   else if(currentState === 'none')   {
    //             toggleDomainDetailsContent('on')
    //         }  
    //     })

}

function toggleDomainDetailsContent(state) {
    let domainDetailsContentArea = d3.select('#domainListContentArea')
    let domainDetailsHeading = d3.select('#domainListHeading')
    if(state === 'on') {
        domainDetailsContentArea.style('display', 'block')
        domainDetailsHeading
            // .classed('toggleOnBG', true)
            // .classed('toggleOffBG', false)
        toggleExploreTOCArea('off')
    }   else  if (state === 'off')   {
        domainDetailsContentArea.style('display', 'none')
        domainDetailsHeading
            // .classed('toggleOffBG', true)
            // .classed('toggleOnBG', false)
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

    //ux/ui interactions
    // detailsHeading
    //     .on('mouseover', function() {activateItemLink(this)})
    //     .on('mouseout', function() {deActivateItemLink(this)})
    //     .on('dblclick', function() { 

    //         let currentState = detailsListDiv.style('display')

    //         if(currentState === 'block') {
    //             toggleArticleDetailsContent('off')
    //         }   else if(currentState === 'none')   {
    //             toggleArticleDetailsContent('on')
    //         }   
    //     })
}

function toggleArticleDetailsContent(state) {
    let detailsContentArea = d3.select('#detailsContentArea')
    let articleDetailsHeading = d3.select('#articleDetailsHeading')

    if(state === 'on') {
        detailsContentArea.style('display', 'block')
        articleDetailsHeading
            // .classed('toggleOnBG', true)
            // .classed('toggleOffBG', false)
        toggleExploreTOCArea('off')
    }   else  if (state === 'off')   {
        detailsContentArea.style('display', 'none')
        articleDetailsHeading
            // .classed('toggleOffBG', true)
            // .classed('toggleOnBG', false)
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

    ////// ux/ui interactions

    // linkDirectionHeading
    //     .on('mouseover', function() {activateItemLink(this)})
    //     .on('mouseout', function() { deActivateItemLink(this)})
    //     .on('dblclick', function() { 
    //         let currentState = linkDirectionContentArea.style('display')

    //         if(currentState === 'block') {
    //             toggleLinkDirectionContent('off')
    //         }   else if(currentState === 'none')   {
    //             toggleLinkDirectionContent('on')
    //             toggleArticleListContent('off')
    //         }  
    //     })

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
            setGraphMode('Explore')
        })

}

function activateLinkDirDomItem(itemClass, mouseReference) {

    d3.selectAll(itemClass).each(function (d,i) {
        if(mouseReference === this) {
            d3.select(this)
                .style('font-weight', 'bold')
                .transition().duration(200).style('opacity', stylesConfig.listItems.defaultOpacity)
        }   else    {
            d3.select(this)
                .style('font-weight', 'normal')
                .transition().duration(200).style('opacity', stylesConfig.listItems.dimmedOpacity)
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
        linkDirectionHeading
            // .classed('toggleOnBG', true)
            // .classed('toggleOffBG', false)
    }   else if(state==='off') {
        linkDirectionContentArea.style('display', 'none')
        linkDirectionHeading
            // .classed('toggleOnBG', false)
            // .classed('toggleOffBG', true)
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
        // .classed('toggleOnBG', true)

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

    // setup UI interactions
    // linkDomainHeading
    //     .on('mouseover', function() {activateItemLink(this)})
    //     .on('mouseout', function() { deActivateItemLink(this)})
    //     .on('dblclick', function() { 
    //         let currentState = linkDomainContentArea.style('display')

    //         if(currentState === 'block') {
    //             toggleLinkDomainContent('off')
    //         }   else if(currentState === 'none')   {
    //             toggleLinkDomainContent('on')
    //             toggleArticleListContent('off')
    //         }  
    //     })

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
            setGraphMode('Explore')
            
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
               setGraphMode('Explore')
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

    let linkLinesGroup = simulationConfig.relatedLinks
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
                .style('opacity', stylesConfig.linkLines.articleGraphOpacity)
                .merge(linkLines)



    let relatedArticleIDs = relatedArticles.map(article => article.id)

    // reduce link opacity for all non-activated links
    d3.selectAll('.link').
        each(function (d,i) {
            d3.select(this)
                .transition().duration(200).attr('opacity', function (link) { 
                    return link.target.id === activeElement.id ? stylesConfig.link.activeOpacity : stylesConfig.link.inactiveOpacity
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
                .transition().duration(200).attr('opacity', match ? stylesConfig.link.activeOpacity : stylesConfig.link.inactiveOpacity)
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

        d3.selectAll('.relatedLinkLines').transition().duration(100).style('opacity',stylesConfig.linkLines.inactiveOpacity)
    }

    activateArticleListItem();

}

function activateArticleListItem() {
    let activeNodes = d3.selectAll('.label').filter(function (d,i) {  return d3.select(this).style('fill-opacity') > 0.5})
    let nodeTitles = activeNodes.data().map(node => node.title)
    let listOfArticles = d3.selectAll('.linkArticlesListItem')
    listOfArticles.each(function (d) {
        let articleRef = this
        if(nodeTitles.includes(d.title)) {
            d3.select(articleRef).transition().duration(200).style('opacity', stylesConfig.listItems.defaultOpacity)
        }   else    {
            d3.select(articleRef).transition().duration(200).style('opacity', stylesConfig.listItems.dimmedOpacity)
        }
    })


}

function setNodeLabelOpacity(selectedElement, elementsArray, activeElement) {
    let opacityValue;

    if (elementsArray.includes(selectedElement.id)) {opacityValue = stylesConfig.nodeLabel.inArrayOpacity}
    if (!elementsArray.includes(selectedElement.id)) {opacityValue = stylesConfig.nodeLabel.notInArrayOpacity}
    if (selectedElement.index === 0) {opacityValue = stylesConfig.nodeLabel.centralNodeDimmedOpacity}
    if (typeof(activeElement) !== 'undefined') {
        if (selectedElement.id === activeElement.id) { opacityValue = stylesConfig.nodeLabel.defaultOpacity}
    }

    return opacityValue

}

function resetListItemDefaults(itemClass) {
    d3.selectAll(itemClass)
        .transition().duration(200).style('opacity',stylesConfig.listItems.defaultOpacity)
        .style('font-weight', 'normal')
}
   

function resetDisplayDefaultsArticleGraph() {
    d3.selectAll('.link').transition().duration(200).attr('opacity', stylesConfig.link.defaultOpacity);
    d3.selectAll('.label').transition().duration(200).attr('fill-opacity', stylesConfig.nodeLabel.defaultOpacity);
    d3.selectAll('.node').transition().duration(200).style('opacity', stylesConfig.nodeLabel.defaultOpacity);
    d3.selectAll('.relatedLinkLines').transition().duration(200).style('opacity',stylesConfig.linkLines.inactiveOpacity)
    d3.select('.d3plus-textBox').transition().duration(200).style('opacity',stylesConfig.nodeLabel.defaultOpacity)

    resetListItemDefaults('.linkDirListItem')
    resetListItemDefaults('.linkDomainListItem')
    resetListItemDefaults('.linkArticlesListItem')

} 

// ****** DOMAIN GRAPH FUNCTIONS ****** 

function setDomainGraphTitle(domainTitle) {
    let selectedDomainTitle = d3.select('#selectedEntryTitle').select('h1')
    selectedDomainTitle
        .text(domainTitle)
        .style('color', function(d) {return color(domainTitle)})
        .classed('selectedEntryTitle',true)

}

function setDomainMenuTitle(domainTitle, borderState) {
    domainMenu.property('value', domainTitle)

    if(domainTitle === '[Search domains...]') {
        domainMenu
            .classed('menuBorderOn', false)
            .classed('menuBorderOff', true)
    }   else {
        domainMenu
            .classed('menuBorderOn', true)
            .classed('menuBorderOff', false)
    }

}
function showDomainGraph(domainTitle) {

    d3.json(json_file).then(function(data) {
        
        let domainData = getDomainData(data,domainTitle)
        setGlobalNodesLinks(domainData)
        drawDomainSimulation(data, domainData)
        updateSidebarLeft_DomainMain(data, domainData);
        updateSidebarRight_DomainMain(data, domainData);
        updateNeighborNodes();
        setDomainGraphTitle(domainTitle)
        setDomainMenuTitle('[Search domains...]')
        setArticleMenuTitle('[Search articles...]')
        window.getSelection().removeAllRanges();
        updateRecentSearch(domainData);
        resetDisplayDefaultsArticleGraph();
        resetDisplayDefaultsDomainGraph();
        setGraphMode('Preview')
        setGraphInstructions('Domain')

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
    link = simulationConfig.links.selectAll('.link')
        .data(graphLinks, function(d) {return `${d.source}-${d.target}`});

    link.exit().remove();

    link = link.enter()
               .append('line')
               .attr("stroke", stylesConfig.link.strokeColor)
               .attr("stroke-width", stylesConfig.link.strokeWidth)
               .attr("opacity", stylesConfig.link.defaultOpacity)
               .classed('link',true).merge(link)

    //nodes

    let numLinksRange = graphNodes.map(node=>node.numLinks)
    let scaleNodeRadius = d3.scaleLinear()
        .domain([d3.min(numLinksRange), d3.max(numLinksRange)])
        .range([2,15])


    node = simulationConfig.nodes.selectAll('.node')
                         .data(graphNodes, function (d) {return d.id})
                         .attr("r", function(d) {return scaleNodeRadius(d.numLinks)})
                         .attr("fill", function(d) {return color(d.primary_domain)})
    
    node.exit().remove()

    node = node.enter()
                .append('circle')
                .attr("r", function(d) {return scaleNodeRadius(d.numLinks)})
                .attr("fill", function(d) {return color(d.primary_domain)})
                .attr("stroke", stylesConfig.nodeLabel.strokeColor)
                .attr("stroke-width",  stylesConfig.nodeLabel.strokeWidth)
                .attr('nodeID', function(d) {return d.id})
                .style('opacity',1)
                .classed('node',true)
                .merge(node)

    node.on('mouseover', function() {mouseOverDomainNode(this, data, domainData)})
    node.on('mouseout', function() {mouseOutDomainNode(this, data, domainData)})
    node.on('click', function() { sngClickDomainNode(this, data, domainData)})
    node.on('dblclick', function() {dblClickDomainNode(this, data)})    
             
    simulationConfig.simulation.on('tick', function () {
        link
            .attr("x1", function(d) {return d.source.x })
            .attr("y1", function(d) {return d.source.y })
            .attr("x2", function(d) {return d.target.x})
            .attr("y2", function(d) {return d.target.y})

        node
            .attr("cx", function(d) {return d.x })
            .attr("cy", function(d) {return d.y });


    })
    
    //restart simulation
    simulationConfig.simulation.nodes(graphNodes);
    simulationConfig.simulation.force("charge").strength(function() { return forceStrength(countOfNodes)})
    simulationConfig.simulation.force("link").id(function (d) {return d.id})
                                             .distance(function (d) {return (countOfNodes > 250) ? 250 : 300})
    simulationConfig.simulation.force("link").links(graphLinks)
    simulationConfig.simulation.force("forceX").strength(.5)
    simulationConfig.simulation.force("forceY").strength(.5)
    simulationConfig.simulation.force("collide").radius(15)
    simulationConfig.simulation.alpha(1).restart();

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
        .text("Most Connected Nodes")
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
        .text("List of Articles")
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
                .html(function(d) {return d.title})
                .style('color', function(d)  { return color(d.primary_domain)})
                .classed('domainArticle', true)
                .classed('panelListItem', true)
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
    setGraphMode('Explore')

        
}
function mouseOverDomainNode(mouseOverReference, data, domainTitle) {
    activateItemLink(mouseOverReference)
    let selectedNode = d3.select(mouseOverReference).datum()

    if(!exploreMode) { previewDomainNode(mouseOverReference, data, domainTitle) }
    if(exploreMode) {
        currentDomainCentralNode = getDomainCentralNode()
        let selectedNode = d3.select(mouseOverReference).datum()
        let nodeCircle = d3.selectAll('.node').filter(function (d,i) { return d.id === selectedNode.id })
        updateSideBarLeft_ArticleMain(selectedNode, 'Preview')

        if(+nodeCircle.style('opacity') === stylesConfig.nodeLabel.neighborNodeOpacity) {
            nodeCircle.style('opacity', stylesConfig.nodeLabel.defaultOpacity)
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
        d3.selectAll('.relatedLinkLines').style('opacity',stylesConfig.linkLines.inactiveOpacity)
        if(typeof(currentDomainCentralNode.title) !== null ) {
            if(selectedNode.title !== currentDomainCentralNode.title) { 
                if(priorNodeCircle_ListItem) { priorNodeCircle_ListItem.style('opacity', stylesConfig.nodeLabel.neighborNodeOpacity) }
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
        return link.source.id === activeElement.id  || link.target.id === activeElement.id ? stylesConfig.link.activeDomainOpacity : stylesConfig.link.inactiveDomainOpacity;
    });

    d3.selectAll('.node').transition().duration(300).style("opacity", function (node) {
        if(activeElement.id === node.id) {
            return stylesConfig.nodeLabel.defaultOpacity
        }   else {
            return isNeighborNode(activeElement.id, node.id) ?  stylesConfig.nodeLabel.neighborNodeOpacity : stylesConfig.nodeLabel.notInArrayOpacity;
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
            d3.select(this).transition().duration(200).style('opacity',stylesConfig.listItems.defaultOpacity)
        }   else {
            d3.select(this).transition().duration(200).style('opacity',stylesConfig.listItems.dimmedOpacity)
        }
    })
    d3.selectAll('.domainArticle').each(function (d) {
        if(labelsText.includes(d.title)) {
            d3.select(this).transition().duration(200).style('opacity',stylesConfig.listItems.defaultOpacity)
        }   else {
            d3.select(this).transition().duration(200).style('opacity',stylesConfig.listItems.dimmedOpacity)
        }
    })
}

function positionRelatedDomainLabels(activeElement) {

    let domainLabelsGroup = simulationConfig.domainLabels
        domainLabelsGroup
            .html('')
                .style('opacity',stylesConfig.nodeLabel.defaultOpacity)

    let domainLabelsLeft = [];
    let domainLabelsRight = [];
    let currentMainNode = [];

    let domainNodes = d3.selectAll('.node')

    domainNodes.each(function(node,index) {
        let circle = d3.select(this)
        let nodeCX = +circle.attr('cx')
        let nodeCY = +circle.attr('cy') 
        let nodeRadius = +circle.attr('r')
        let nodeID = circle.attr('nodeID')
        let nodePrimaryDomain = node.primary_domain
        let nodeTitle = node.title
        let labelObj = {'id':nodeID, 'cx':nodeCX, 'cy': nodeCY, 'r': nodeRadius,
                        'text':nodeTitle, 'title':nodeTitle, 'primaryDomain':nodePrimaryDomain}
        
        if(activeElement.id !== nodeID) {
            if(isNeighborNode(activeElement.id, nodeID)) {
                if(nodeCX > 0) {
                    domainLabelsRight.push(labelObj)
                }   else    { 
                    domainLabelsLeft.push(labelObj)
                }
            }
        }   else {
            currentMainNode.push(labelObj)
        }
    })

    domainLabelsLeft.sort((a,b) => d3.ascending(a.cy, b.cy))
    domainLabelsRight.sort((a,b) => d3.ascending(a.cy, b.cy))

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
        .x(-400)
        .fontFamily('proxima-nova, sans-serif')
        .fontSize(12)
        .fontColor(function(d) {return color(d.primaryDomain)})
        .verticalAlign('top')
        .textAnchor('start')
        .width(function() {return (domainLabelsLeft.length > 30) ? 275 : 250})
        .lineHeight(function() {return (domainLabelsLeft.length > 30) ? 9 : 11})
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
        .x(function(d) {return (domainLabelsRight.length > 30) ? 125 : 150})
        .textAnchor('end')
        .fontFamily('proxima-nova, sans-serif')
        .fontSize(12)
        .fontColor(function(d) {return color(d.primaryDomain)})
        .verticalAlign('top')
        .width(function(d) {return (domainLabelsRight.length > 30) ? 275 : 250})
        .lineHeight(function(d) {return (domainLabelsRight.length > 30) ? 9 : 11})
        .height(35)
        .render();

        // UX/UI functions 
        let mainDomainNodeLabel = d3.select('.mainDomainNode')
            mainDomainNodeLabel.transition().duration(50).style('fill-opacity', stylesConfig.nodeLabel.defaultOpacity)
        
            let domainLabelsList = d3.selectAll('.d3plus-textBox')

        domainLabelsList.transition().duration(200).style('fill-opacity', stylesConfig.nodeLabel.defaultOpacity)
    
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
            nodeCircle.style('opacity', stylesConfig.nodeLabel.defaultOpacity)

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

            if(selectedNode.title !== currentDomainCentralNode.title) { priorNodeCircle.style('opacity', stylesConfig.nodeLabel.neighborNodeOpacity) }

            // updateSidebarLeft_DomainMain(currentDomainCentralNode)
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
    if (arrayLength > 30 ) {cyMin = -300; cyMax = 350}

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
    let widthOffset = (labelX === 150) ? 250 : 275
    let startX = labelX < 0 ? labelX + width + 5 :labelX + (widthOffset - width) + 5
    let startY = (labelY + (height/2));

    return {startX, startY}
}
function drawDomainLinkLine(labelData, nodeCircle) {

    let nodeCircleCX = +nodeCircle.attr('cx')
    let nodeCircleCY = +nodeCircle.attr('cy')
    let nodeCircleDomain = nodeCircle.datum().primary_domain

    let linkLinesGroup = simulationConfig.relatedLinks
    linkLinesGroup.html('')
    linkLinesGroup
            .style('opacity', stylesConfig.linkLines.domainGraphOpacity)


    linkLinesGroup
        .append('line')
        .attr('x1', labelData.startX)
        .attr('y1', labelData.startY)
        .attr('x2', nodeCircleCX)
        .attr('y2', nodeCircleCY)
        .attr('id', 'test')
        .style('stroke', function() {return color(nodeCircleDomain)})
        .classed('relatedLinkLines', true)
        .transition().duration(200).style('opacity', stylesConfig.linkLines.domainGraphOpacity)

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

    clearSidebar(sidebarLeft)

    let links = d3.selectAll('.link')
        .transition().duration(200).attr("opacity", stylesConfig.link.defaultOpacity);

    let nodes = d3.selectAll('.node')
        .transition().duration(200).style("opacity", stylesConfig.nodeLabel.defaultOpacity);
    
    let linkLines = d3.selectAll('.relatedLinkLines')
        .transition().duration(200).style('opacity',stylesConfig.linkLines.inactiveOpacity)

    d3.selectAll('.d3plus-textBox')
        .transition().duration(200).style('opacity',stylesConfig.nodeLabel.defaultOpacity)

    let domainLabelsGroup = simulationConfig.domainLabels
    
    domainLabelsGroup
        .transition().duration(200).style('opacity',stylesConfig.nodeLabel.inactiveOpacity)
        
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

    let scaleForces= d3.scaleLinear()
        .domain([10, 125])
        .range([-1000,-30])

    let strength = scaleForces(numberOfNodes)
 

    // let strength;
    // if (numberOfNodes <= 10) { strength = -600 } //1000
    // if (numberOfNodes > 10 && numberOfNodes <= 20) { strength = -500 } //1000
    // if (numberOfNodes > 20 && numberOfNodes <= 30) { strength = -400 } //800
    // if (numberOfNodes > 30 && numberOfNodes <= 40) { strength = -300 } //600
    // if (numberOfNodes > 40 && numberOfNodes <= 50) { strength = -200} //400
    // if (numberOfNodes > 50 && numberOfNodes <= 60) { strength = -150 } //200
    // if (numberOfNodes > 60 && numberOfNodes <= 70) { strength = -100 } //100
    // if (numberOfNodes > 70 && numberOfNodes <= 80) { strength = -75 }  
    // if (numberOfNodes > 80 && numberOfNodes <= 90) { strength = -50 }  
    // if (numberOfNodes > 90) { strength = -30 }  

    // console.log(strength)
    // console.log(forceStrengthScale)
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
            rgbValue = 'rgb(255, 250, 125)' //#FFFA7D
            break;

        // purples
        case 'Aesthetics':
            rgbValue = 'rgb(196, 134, 255)' //#C486FF
            break;

        // violet 
        case 'Religion':
            rgbValue = 'rgb(255, 0, 237)' //#FF00ED
            break;

        // social and political philosophies
        // reds
        case 'Ethics and Morality':
            rgbValue = 'rgb(255, 139, 163)' //#FF8BA3
            break;

        case 'Political and Social Theory': //#E44C96
            rgbValue = 'rgb(228, 76, 150)'
            break;
    
        case 'Law':
            rgbValue = 'rgb(255, 125, 99)' //#FF7D63
            break;
    
        case 'Economics':
            rgbValue = 'rgb(255, 29, 18)' //#FF1D12
            break;
    
        case 'Feminism':
            rgbValue = 'rgb(255, 100, 44)' //#FF642C
            break;

        // cultural philosophies
        // orange tones 

        case 'Existentialism and Phenomenology':
            rgbValue = 'rgb(255, 103, 0)' //#FF6700
            break;

        case 'Chinese Philosophy':
            rgbValue = 'rgb(255, 153, 45)' //#FF992D
            break;   

        case 'Japanese Philosophy':
            rgbValue = 'rgb(255, 153, 1)' //#FF9901
            break;

        case 'Indian Philosophy':
            rgbValue = 'rgb(255, 168, 0)' //#FFA800
            break;

        case 'Latin American Philosophy':
            rgbValue = 'rgb(255, 203, 36)' //#FFCB56
            break;

        case 'Arabic and Islamic Philosophy':
            rgbValue = 'rgb(255, 192, 7)' //#FFC007
            break;

        case 'African and African-American Philosophy':
            rgbValue = 'rgb(255, 210, 0)' //#FFD200
            break;

        // langauge, logic, math, computer science
        // greens
        case 'Language':
            rgbValue = 'rgb(187, 255, 9)' //#BBFF09
            break;

        case 'Logic':
            rgbValue = 'rgb(104, 255, 7)' //#68FF07
            break;

        case 'Mathematics':
            rgbValue = 'rgb(4, 255, 21)' //#04FF15
            break;

        case 'Computer Science':
            rgbValue = 'rgb(11, 255, 117)' //#0BFF75
            break;

        //blue green 
        case 'Metaphysics':
            rgbValue = 'rgb(182, 222, 250)' //#00FFF4 -- #B7DEFA
            break;

        case 'Epistemology':
            rgbValue = 'rgb(0, 219, 255)' // #00DBFF
            break;
    
        case 'Mind':
            rgbValue = 'rgb(147, 221, 255)' //#93DDFF
            break;
    
    
        // scientific philosophies
        // blues

        case 'Scientific Methods':
            rgbValue = 'rgb(0, 135, 255)' //#0087FF
            break;

        case 'Biology':
            rgbValue = 'rgb(0, 81, 255)' // #0051FF
            break;
    
        case 'Evolution':
            rgbValue = 'rgb(73, 116, 255)' //#4974FF
            break;

        case 'Genetics':
            rgbValue = 'rgb(119, 134, 255)' //#7786FF
            break;

        case 'Physics':
            rgbValue = 'rgb(56, 69, 255)' //#3845FF
            break;    

        case 'Quantum Mechanics':
            rgbValue = 'rgb(97, 87, 255)' //#6157FF
            break;






    
        

    }
    return rgbValue
}

function getRandom() {
    let randomEntry  = getRandomIntInclusive(0,allEntries.length)
    if (randomEntry <= articleMenu.nodes()[0].length-1) {
        showArticleGraph(allEntries[randomEntry])
    }   else {
        showDomainGraph(allEntries[randomEntry])
    }


}
function getRandomIntInclusive(min, max) {
    //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive 
  }