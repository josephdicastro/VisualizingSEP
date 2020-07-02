// ****** Global Variables ******

// Select Page Elements
let svg = d3.select('svg')
let articleMenu = d3.select('#articleSearchMenu')
let domainMenu = d3.select('#domainSearchMenu')
let introDiv = d3.select('#intro') 
let articleGraphDiv = d3.select('#articleGraph')
let sidebarLeft = d3.select("#sidebarLeft") 
let sidebarRight = d3.select("#sidebarRight")

//Initialize nodes and links arrays for simulation
let nodes = [];
let links = [];
let biLinks = [];
let inLinks = [];
let outLinks = [];

// Initialize SVG and Simulation
let svgConfig = initializeParentSVG(svg);

//Initialze article and domain caches for SEP data 
let articleSearchCache = [];
let domainSearchCache = [];

//
let neighborNodes = [];

let linkAngles = [];

//set BaseURL for SEP Edition
//current SEP edition: Spring 2020
let baseURL = 'https://plato.stanford.edu/archives/spr2020';

d3.json('static/sep_network_test.json').then(function(data) { startVisualization(data)} );

function startVisualization(data) {
    let articleSimulationConfig = initializeSimulation(svgConfig);  
    loadArticleMenu(data)
    loadDomainMenu(data)
    showArticleGraphAreas() 
    showHomeMenu(data, articleSimulationConfig)

    //UI Response features
    articleMenu.on('change', function(){
        let articleTitle = d3.event.target.value;
        showArticleGraph(data, articleTitle, articleSimulationConfig)
    })

    domainMenu.on('change', function(){
        let domainTitle = d3.event.target.value; 
        showDomainGraph(data, domainTitle, articleSimulationConfig)
        
    })
}

// ****** SET GLOBALS  ********

function setGlobalNodesLinks(sepNetworkObject) {

    nodes.length = 0
    links.length = 0

    sepNetworkObject.nodes.forEach(node => nodes.push(node))
    sepNetworkObject.links.forEach(link => links.push(link))

}
function setGlobalLinkDir(sepNetworkObject) {
    biLinks.length = 0
    outLinks.length = 0 
    inLinks.length = 0 

    sepNetworkObject.biLinks.forEach(biLink => biLinks.push(biLink))
    sepNetworkObject.inLinks.forEach(inLink => inLinks.push(inLink))
    sepNetworkObject.outLinks.forEach(outLink => outLinks.push(outLink))
}

// ****** INITIALIZATION FUNCTIONS ********

function initializeParentSVG(svg) {
    // set basic SVG Config data 
    let margin = {
        top: 100,
        right: 50,
        bottom:50,
        left:100
    };

    // let areaWidth = 900;
    let areaWidth = 1000
    let areaHeight = 750;

    let width = areaWidth - margin.left - margin.right;
    let height = areaHeight - margin.top - margin.bottom;

    svg.attr("viewBox", "0 0 " + width + " " + height )
       .attr("preserveAspectRatio", "xMidYMid meet")

    return {margin, areaWidth, areaHeight, width, height, svg}
}

function initializeSimulation(svgConfig) {
    //clear out child SVG elements
    svgConfig.svg.html("")

    //create SVG group centered in the middle of the svg space
    g1 = svgConfig.svg.append('g')
                       .attr("transform", `translate(${svgConfig.width/2},${svgConfig.height/2})`)
                       .classed('articleGraphGroup', true)

    //create secondary svg group so that we can add our graph elements to this group
    let graph_elements = g1.append('g')
                            .classed('articleElements', true)
                            .attr('width',1000)

    // create main graph elements
    let links = graph_elements.append("g")
                             .classed('links',true)

    let labels = graph_elements.append("g")
                              .classed('labels',true)

    let nodes = graph_elements.append("g")
                             .classed('nodes',true)

    let simulation = d3.forceSimulation()
        .force("charge", d3.forceManyBody())
        .force("link", d3.forceLink())
        .force("center", d3.forceCenter())
        .force("forceX", d3.forceX())
        .force("forceY", d3.forceY())
        .alphaTarget(1);

    return {links, nodes, labels, simulation}
}

// ****** MENU FUNCTIONS ********

function loadArticleMenu(data) {

    let articles = ["[Search articles...]"]
    data.articles.nodes.forEach(node => articles.push(node.title))

    //load into article search menu
    articleMenu.selectAll("option")
                .data(articles)
                .enter().append("option")
                        .attr("value", (d) => d)
                        .html((d) => d)

}

function loadDomainMenu(data) {

    let domains = ["[Search domains...]"]
    data.domains.nodes.forEach(node => domains.push(node.title))
    //load into searchMenu
    domainMenu.selectAll("option")
                .data(domains)
                .enter().append("option")
                        .attr("value", (d) => d)
                        .html((d) => d)

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
}

// ****** ARTICLE GRAPH FUNCTIONS ****** 

function showArticleGraph(data, articleTitle, articleSimulationConfig) {

    let articleData = getArticleData(data,articleTitle)
    setGlobalNodesLinks(articleData)
    setGlobalLinkDir(articleData)
    let articleNode = nodes[0]
    drawArticleSimulation(data, articleSimulationConfig)
    updateSidebarsArticle(data, articleNode, articleSimulationConfig);
    window.getSelection().removeAllRanges();
    domainMenu.value = "[Search domains...]"

}
function getArticleData(data, articleTitle) {
    let articleData = {};
    let inArticleCache = articleSearchCache.find( ({search}) => search === articleTitle);
    if (!inArticleCache) {
        articleData = getArticleDataFromJSON(data, articleTitle); 
    }   else    {
        articleData = inArticleCache
    }

    return articleData
}
function getArticleDataFromJSON(data, articleTitle) {      

    let articleNodes = [];
    let articleLinks = [];  
    let articleData = {};
    let linkDomains = new Set();

    //get the base node to build our graph around    
    let searchNode = data.articles.nodes.filter(node => {
        return node.title === articleTitle
    })
    //get the url for the base node
    let searchID = searchNode[0].id 

    let sourceLinks = new Set()
    let targetLinks = new Set()

    data.articles.links.forEach(link => { 
        if (searchID === link.source && searchID !== link.target)  {
            sourceLinks.add(link.target)
        }   else if (searchID === link.target && searchID !== link.source)  {
            targetLinks.add(link.source)
        }
    })

    let _biLinks = intersection(sourceLinks,targetLinks)
    let _outLinks = symmetricDifference(_biLinks, sourceLinks)
    let _inLinks = symmetricDifference(_biLinks, targetLinks)

    articleLinks = combineLinks(searchID, _biLinks, _outLinks, _inLinks)

    articleNodes.push(searchNode[0])

    articleLinks.forEach(link => {
        data.articles.nodes.filter(node => {
            if (node.id === link.target) {
                articleNodes.push(node)
            }
        })
    }) 

    articleNodes.forEach(node => linkDomains.add(node.primary_domain))
    //store the articleData term as an object
    articleData = { "search": articleTitle,
                    "nodes": articleNodes,
                    "links": articleLinks,
                    "biLinks": _biLinks,
                    "inLinks": _inLinks,
                    "outLinks": _outLinks, 
                    "linkDomains": linkDomains }
    
    articleSearchCache.push(articleData)

    return articleData

    
}
function drawArticleSimulation(data, simulationConfig) {

    let centralNode = nodes[0]
    let numTicks = 0;
    let transitionTime = 2000;
    let ticksCompleted = false;
    let inElements = []
    let outElements = []
    let biElements = []

    //links
    link = simulationConfig.links.selectAll('.link')
                         .data(links, function(d) {return `${d.source}-${d.target}`})
                         .attr('dir', function(d) {return d.dir})
                         .attr('target', function(d) { return d.target })

    link.exit().remove();

    link = link.enter()
               .append('line')
               .attr("stroke", "#999")
               .attr("stroke-width", 1)
               .attr("opacity", 0.3)
               .attr('dir', function(d) {return d.dir})
               .attr('nodeID', function(d) { return d.target })
               .classed('link',true).merge(link)

    //labels
    label = simulationConfig.labels.selectAll('.label')
                           .data(nodes, function(d) {return d.title})
                           .attr("display", "block")
                           .classed('mainLabel', function(d,i) {return i===0?true:false})
                           .attr("fill", function(d) {return color(d.primary_domain)})
    label.exit().remove();

    label = label.enter()
                 .append("text")
                 .text(function(d) {return d.title})
                 .attr("display", "block")
                 .attr("font-size", '10px')
                 .attr("fill", function(d) {return color(d.primary_domain)})
                 .attr('nodeID', function(d) {return d.id})
                 .classed('label',true)
                 .classed('mainLabel', function(d,i) {return i===0?true:false})
                 .merge(label)

    label
        .on('mouseover', function() {mouseOverArticleGraph(this, data, simulationConfig)})
        .on('mouseout', function() {mouseOutArticleGraph(this, centralNode, data, simulationConfig)})
        .on('dblclick', function() {dblClickArticleGraph(this, data, simulationConfig)})


    //nodes
    node = simulationConfig.nodes.selectAll('.node')
                         .data(nodes, function (d) {return d.id})
                         .attr("r", 5)
                         .attr("fill", function(d) {return color(d.primary_domain)})
    
    node.exit().remove()

    node = node.enter()
                .append('circle')
                .attr("r", 5)
                .attr("fill", function(d) {return color(d.primary_domain)})
                .attr("stroke", "#fff")
                .attr("stroke-width", .5)
                .attr('nodeID', function(d) {return d.id})
                .style('opacity',1)
                .classed('node',true)
                .merge(node)
    node
        .on('mouseover', function() {mouseOverArticleGraph(this, data, simulationConfig)})
        .on('mouseout', function() {mouseOutArticleGraph(this, centralNode, data, simulationConfig)})
        .on('dblclick', function() {dblClickArticleGraph(this, data, simulationConfig)})

    //deselect any selected nodes
    // window.getSelection().removeAllRanges();

    //update simulation
    simulationConfig.simulation.on('tick', function (){
        let tickLimit = ticksByNodeCount(nodes.length)

        if (numTicks < tickLimit) {
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
                .attr('x', function(d) {return d.index === 0 ? 0: setXpos(d.x,this.getBBox().width) })
                .attr('y', function(d) {return d.index === 0 ? -10: d.y+4})
                .attr("transform", function(d,i){ return i===0 ?`rotate(0)`:rotateLabel(i,d.x, d.y)})

                numTicks++
            }   else {   
            ticksCompleted = true
        }

    })

    //restart simulation
    simulationConfig.simulation.nodes(nodes);
    simulationConfig.simulation.force("charge").strength(function() { return forceStrength(nodes.length)})
    simulationConfig.simulation.force("link").id(function (d) {return d.id})
                                             .distance(200)
    simulationConfig.simulation.force("link").links(links)
    simulationConfig.simulation.force("forceX").strength(0)
    simulationConfig.simulation.force("forceY").strength(0)
    simulationConfig.simulation.alpha(1).restart();

    //updateSideBars




}
function updateSidebarsArticle_old(data, currentNode, simulationConfig) {

    if(currentNode) {
        
        //clear areas
        sidebarLeft.html("")
        sidebarRight.html("")

        sidebarLeft.style("display", "block")
        sidebarRight.style("display", "block")

        //**populate sidebarLeft**
        
        let articleText = sidebarLeft.append("div")

        // Title
        if (typeof(currentNode.title)!=='undefined') {
            articleText.append("h3")
            .text(currentNode.title)
            .classed('articleDetailH3',true)
        }

        // Intro Paragraph
        if (typeof(currentNode.first_paragraph)!=='undefined') {
            let paragraphData = getParagraphDataHTML(currentNode.first_paragraph);
            articleText.append("div")
                .html(paragraphData)
                .classed('firstParagraph', true)
        }

        //**populate sidebarRight**

        //create div to hold all sidebar details
        let articleDetails = sidebarRight.append("div")

        articleDetails.append("h3")
        .text("Article Details")
        .classed('articleDetailH3', true)

        //create div to list domains 
        let domainListDiv = articleDetails.append("div")
        domainListDiv.append("h4")
            .text("This article appears in these taxonomies")
            .classed('articleDetailH4', true)

        domainListDiv.append("ul")
            .selectAll(".domainListItem")
            .data(currentNode.domain_tags.split(','))
                .enter()
                .append('li')
                .html(function(d) {return d})
                .classed('domainListItem', true)
            .exit().remove()
    
        // create div to list analyses
        let linkAnalysisDiv = articleDetails.append("div")
        linkAnalysisDiv.append("h4")
        .text("Link Analysis")
        .classed('articleDetailH4', true)

        linkAnalysisDiv.append("p")
        .text(`${links.length} articles are linked to this one.`)
        .classed('firstParagraph', true)
        
        
        // build direction links data 
        let directionLinks = linkAnalysisDiv.append("div")

        directionLinks.append("h5")
        .text("Link Direction Summary")
        .classed('articleDetailH5', true)

        linkItems = [`Bi-Directional Links: ${biLinks.length}`,
                     `In-coming Links: ${inLinks.length}`,
                     `Out-going Links: ${outLinks.length}`]

        directionLinks.append("ul")
            .selectAll(".linkDirListItem")
            .data(linkItems)
            .enter()
            .append('li')
            .html(function(d) {return d})
            .classed('linkDirListItem', true)
        .exit().remove()

        // build domain links data 
        let linkDomainLinks = linkAnalysisDiv.append("div")

        linkDomainLinks.append("h5")
        .text("Link Domain Summary")
        .classed('articleDetailH5', true)  

        let linkDomainList = new Set() 
        nodes.forEach(node => linkDomainList.add(node.primary_domain))
        console.log(linkDomainList)

        //create div to hold SEP link
        let sepLinkDiv = articleDetails.append("div")
        let sepURL = baseURL + currentNode.id
    
        sepLinkDiv.append('h4')
            .text('Read the full article at SEP')
            .classed('articleDetailH4', true)

        sepLinkDiv.append("p")
        .html(`<a href="${sepURL}" target="_blank">${currentNode.title}</a>`)
        .classed('sepLink', true)
        .style('color', 'white')
        




        ////// ux/ui interactions

        let domainList = d3.selectAll('.domainListItem')

        domainList
            .on('mouseover', function() { d3.select(this).style("cursor", "pointer"); })
            .on('mouseout', function() {d3.select(this).style("cursor", "default"); })
            .on('dblclick', function () {
                let domainTitle = d3.select(this).datum()
                showDomainGraph(data, domainTitle, simulationConfig)
        })

        let linkList = d3.selectAll('.linkDirListItem')
        linkList
            .on('mouseover', function() {
                d3.select(this).style("cursor", "pointer"); 
                d3.select(this).style("font-weight", "bold")
                let linkDirection = d3.select(this).datum().substring(0,2)
                console.log(linkDirection)
                switch(linkDirection) {
                    case 'Bi':
                        focusOnLinkDirection(biLinks)
                        break;
                    case 'In':
                        focusOnLinkDirection(inLinks)
                        break;
                    case 'Ou':
                        focusOnLinkDirection(outLinks)
                        break;
                }
            })
            .on('mouseout', function() {
                d3.select(this).style("cursor", "default"); 
                d3.select(this).style("font-weight", "normal");
                resetDisplayDefaultsArticleGraph();
            })
            .on('dblclick', function() {})



    }
}

function updateSidebarsArticle(data, selectedArticle, simulationConfig) {
    updateSideBarsAritcleLeft(data, selectedArticle, simulationConfig)
    updateSideBarsArticleRight(data, selectedArticle, simulationConfig)
}
function updateSideBarsAritcleLeft(data, selectedArticle, simulationConfig){
    if(selectedArticle) {
        //clear areas
        sidebarLeft.html("")
        sidebarLeft.style("display", "block")

        //**populate sidebarLeft**
        
        let articleText = sidebarLeft.append("div")

        // Title
        articleText.append("h3")
        .text(selectedArticle.title)
        .classed('articleDetailH3',true)

        // Intro Paragraph
        if (typeof(selectedArticle.first_paragraph)!=='undefined') {
            let paragraphData = getParagraphDataHTML(selectedArticle.first_paragraph);
            articleText.append("div")
                .html(paragraphData)
                .classed('firstParagraph', true)
        }

    }
}

function updateSideBarsArticleRight(data, selectedArticle, simulationConfig){
    if(selectedArticle) {
        //clear areas
        sidebarRight.html("")
        sidebarRight.style("display", "block")

        let articleData = getArticleData(data,selectedArticle.title)
        console.log(articleData)

        //create div to hold all sidebar details
        let articleDetails = sidebarRight.append("div")

        articleDetails.append("h3")
        .text("Article Details")
        .classed('articleDetailH3', true)

        //create div to list domains 
        let domainListDiv = articleDetails.append("div")
        domainListDiv.append("h4")
            .text("This article appears in these domains")
            .classed('articleDetailH4', true)

        domainListDiv.append("ul")
            .selectAll(".domainListItem")
            .data(selectedArticle.domain_tags.split(','))
                .enter()
                .append('li')
                .html(function(d) {return d})
                .classed('domainListItem', true)
            .exit().remove()
    
        // create div to list analyses
        let linkAnalysisDiv = articleDetails.append("div")
        linkAnalysisDiv.append("h4")
        .text("Link Analysis")
        .classed('articleDetailH4', true)

        linkAnalysisDiv.append("p")
        .text(`${articleData.links.length} articles are linked to this one.`)
        .classed('firstParagraph', true)
        
        
        // build direction links data 
        let directionLinks = linkAnalysisDiv.append("div")

        directionLinks.append("h5")
        .text("Link Direction Summary")
        .classed('articleDetailH5', true)

        linkItems = [`Bi-Directional Links: ${articleData.biLinks.size}`,
                     `In-coming Links: ${articleData.inLinks.size}`,
                     `Out-going Links: ${articleData.outLinks.size}`]

        directionLinks.append("ul")
            .selectAll(".linkDirListItem")
            .data(linkItems)
            .enter()
            .append('li')
            .html(function(d) {return d})
            .classed('linkDirListItem', true)
        .exit().remove()

        // build domain links data 
        let linkDomainLinks = linkAnalysisDiv.append("div")

        linkDomainLinks.append("h5")
        .text("Link Domain Summary")
        .classed('articleDetailH5', true)  

        linkDomainLinks.append("ul")
            .selectAll(".linkDomainListItem")
            .data(Array.from(articleData.linkDomains))
            .enter()
            .append('li')
            .html(function(d) {return d})
            // .attr("stroke", function(d) {return color(d)})
            .style("color", function(d) {return color(d)})
            .classed('linkDomainListItem', true)
        .exit().remove()

        //create div to hold SEP link
        let sepLinkDiv = articleDetails.append("div")
        let sepURL = baseURL + selectedArticle.id
    
        sepLinkDiv.append('h4')
            .text('Read the full article at SEP')
            .classed('articleDetailH4', true)

        sepLinkDiv.append("p")
        .html(`<a href="${sepURL}" target="_blank">${selectedArticle.title}</a>`)
        .classed('sepLink', true)
        .style('color', 'white')
        




        ////// ux/ui interactions

        let domainList = d3.selectAll('.domainListItem')

        domainList
            .on('mouseover', function() { d3.select(this).style("cursor", "pointer"); })
            .on('mouseout', function() {d3.select(this).style("cursor", "default"); })
            .on('dblclick', function () {
                let domainTitle = d3.select(this).datum()
                showDomainGraph(data, domainTitle, simulationConfig)
        })

        let linkList = d3.selectAll('.linkDirListItem')
        linkList
            .on('mouseover', function() {
                d3.select(this).style("cursor", "pointer"); 
                d3.select(this).style("font-weight", "bold")
                let linkDirection = d3.select(this).datum().substring(0,2)
                console.log(linkDirection)
                switch(linkDirection) {
                    case 'Bi':
                        focusOnLinkDirection(biLinks)
                        break;
                    case 'In':
                        focusOnLinkDirection(inLinks)
                        break;
                    case 'Ou':
                        focusOnLinkDirection(outLinks)
                        break;
                }
            })
            .on('mouseout', function() {
                d3.select(this).style("cursor", "default"); 
                d3.select(this).style("font-weight", "normal");
                resetDisplayDefaultsArticleGraph();
            })
            .on('dblclick', function() {})

    }
}
function getParagraphDataHTML(ParagraphDataFromNode) {
    let htmlReturn = '';

    //only display the first 500 characters of the node's intro paragraph
    if(typeof(ParagraphDataFromNode)!=='undefined') {
        if(ParagraphDataFromNode !== '') {
            if (ParagraphDataFromNode.length > 500 ) {
                let firstParaText = ParagraphDataFromNode.substring(0,500);
                let lastPeriod = firstParaText.lastIndexOf('.')
                let finalParaText = firstParaText.substring(0,lastPeriod+1)
                let displayCut = `(Only the first ${finalParaText.length} characters of intro text are displayed.)`;
                htmlReturn = "<p>" + finalParaText + "</p>" + 
                             "<p class='displayCut'>" + displayCut + "</p>"
            }  else {
                htmlReturn = "<p>" + ParagraphDataFromNode + "</p>"
            }
        }
    }   else    {
        htmlReturn = ""
    }
    
    return htmlReturn

}
function dblClickArticleGraph(dblClickReference, data, simulationConfig) {
    
    // get node or label activated
    let activeElement = d3.select(dblClickReference)

    if (activeElement.datum().index !== 0) {
    // do the following if the activated node or label was not the central node

        activeElement.style("cursor", "pointer"); 
        resetDisplayDefaultsArticleGraph();
        let articleTitle = activeElement.datum().title
        // updateGraph(data, 'article', articleTitle, simulationConfig)
        showArticleGraph(data, articleTitle,simulationConfig)
    }
}
function mouseOverArticleGraph(mouseOverReference, data, simulationConfig) {
    
    // get node or label activated
    let activeElement = d3.select(mouseOverReference)

    if (activeElement.datum().index !== 0) {
    
        // do the following if the activated node or label was not the central node
        activeElement.style("cursor", "pointer"); 
        focusOnSelectedArticle(activeElement.datum())
        updateSidebarsArticle(data, activeElement.datum(), simulationConfig)
    }
}
function mouseOutArticleGraph(mouseOverReference, centralNode, data, simulationConfig) {
    let activeElement = d3.select(mouseOverReference)
    
    activeElement.style("cursor", "default"); 
    resetDisplayDefaultsArticleGraph();
    updateSidebarsArticle(data, centralNode, simulationConfig)

}
function focusOnSelectedArticle(activeElement) {

        // reduce link opacity for all non-activated links
        d3.selectAll('.link').attr("opacity", function (link) {
            return link.target.id === activeElement.id ? 1 : 0.1
        });

        // reduce label opactiy for non-activated labels
        d3.selectAll('.label').attr("display", function (label) {
            return label.index === 0 || label.id === activeElement.id ? 'block' : 'none';
        });

        // reduce node opacity for non-activated nodes
        d3.selectAll('.node').style("opacity", function (node) {
            return node.index === 0 || node.id === activeElement.id ? 1 : 0.1;
        });
}
function resetDisplayDefaultsArticleGraph() {
    d3.selectAll('.link').attr("opacity", 0.3);
    d3.selectAll('.label').attr("display", "block");
    d3.selectAll('.node').style("opacity", 1);
} 
function focusOnLinkDirection(linksReference) {
      
    d3.selectAll(".link")
        .each(function (d,i) {
            let match = linksReference.includes(d.target.id)
            d3.select(this).attr("opacity", match ? 1 : 0.1)
        })

    d3.selectAll(".label")
        .each(function (d,i) {
            let match = linksReference.includes(d.id) || d.index === 0
            d3.select(this).attr("display", match ? "block" : "none")
        })

    d3.selectAll(".node")
        .each(function (d,i) {
            let match = linksReference.includes(d.id) || d.index === 0
            d3.select(this).style("opacity", match ? 1: 0.1)
        })
}

// ****** DOMAIN GRAPH FUNCTIONS ****** 

function showDomainGraph(data, domainTitle, articleSimulationConfig) {
    let domainData = getDomainData(data,domainTitle)
    console.log(domainData)
    setGlobalNodesLinks(domainData)
    drawDomainSimulation(data, domainTitle, articleSimulationConfig)
    updateSidebarsDomain(data, domainTitle, articleSimulationConfig);
    updateNeighborNodes();
    window.getSelection().removeAllRanges();
}
function getDomainData(data, domainTitle) {
    let domainData = {};
    let inDomainCache = domainSearchCache.find( ({search}) => search === domainTitle);
    if (!inDomainCache) {
        domainData = getDomainDataFromJSON(data, domainTitle); 
    }   else    {
        domainData = inDomainCache
    }

    return domainData
}
function getDomainDataFromJSON(data, domainTitle) {      

    let domainNodes = [];
    let domainLinks = [];  
    let domainData = {};

    // //get the base node to build our graph around    
    // let searchNode = data.domains.nodes.filter(node => {
    //     return node.title === domainTitle
    // })

    let sourceLinks = new Set();

    // console.log(searchNode[0])
    // searchNode[0].data.nodes.forEach(node => domainNodes.push(node))

    domainNodes = data.articles.nodes.filter(node => {
        return node.primary_domain === domainTitle
    })

    domainNodes.forEach(node => {
        data.articles.links.forEach(link => {
            if (node.id === link.source) {
                sourceLinks.add(link)
            }
        })
    })

    domainNodes.forEach(node => {
        sourceLinks.forEach(link => {
            if (node.id === link.target) {
                domainLinks.push(link)
            }
        })
    })

    //store the articleData term as an object
    domainData = { "search": domainTitle,
                    "nodes": domainNodes,
                    "links": domainLinks }
    
    domainSearchCache.push(domainData)

    return domainData

    
}
function drawDomainSimulation(data, entryTitle, simulationConfig){

    let centralNode = nodes[0]
    let numTicks = 0;
    let transitionTime = 2000;
    let ticksCompleted = false;
    let inElements = []
    let outElements = []
    let biElements = []

    //links
    link = simulationConfig.links.selectAll('.link')
                         .data(links, function(d) {return `${d.source}-${d.target}`})

    link.exit().remove();

    link = link.enter()
               .append('line')
               .attr("stroke", "#999")
               .attr("stroke-width", 1)
               .attr("opacity", 0.3)
               .classed('link',true).merge(link)

    //labels
    label = simulationConfig.labels.selectAll('.label')
                           .data(nodes, function(d) {return d.title})
                           .attr("display","none")
                           .attr("fill", function(d) {return color(d.primary_domain)})
    label.exit().remove();

    label = label.enter()
                 .append("text")
                 .text(function(d) {return d.title})
                 .attr("display", "none")
                 .attr("font-size", '10px')
                 .attr("fill", function(d) {return color(d.primary_domain)})
                 .attr('nodeID', function(d) {return d.id})
                 .classed('label',true)
                 .classed('mainLabel', function(d,i) {return i===0?true:false})
                 .merge(label)

    label.on('mouseover', function() {mouseOverDomainGraph(this, data, simulationConfig)})
    label.on('mouseout', function() {mouseOutDomainGraph(this, data, simulationConfig)})
    label.on('dblclick', function() {dblClickDomainGraph(this, data, simulationConfig)})
             
    

    //nodes
    node = simulationConfig.nodes.selectAll('.node')
                         .data(nodes, function (d) {return d.id})
                         .attr("r", 5)
                         .attr("fill", function(d) {return color(d.primary_domain)})
    
    node.exit().remove()

    node = node.enter()
                .append('circle')
                .attr("r", 5)
                .attr("fill", function(d) {return color(d.primary_domain)})
                .attr("stroke", "#fff")
                .attr("stroke-width", .5)
                .attr('nodeID', function(d) {return d.id})
                .style('opacity',1)
                .classed('node',true)
                .merge(node)

    node.on('mouseover', function() {mouseOverDomainGraph(this, data, simulationConfig)})
    node.on('mouseout', function() {mouseOutDomainGraph(this, data, simulationConfig)})
    node.on('dblclick', function() {dblClickDomainGraph(this, data, simulationConfig)})

    //deselect any selected nodes
    window.getSelection().removeAllRanges();

    //update simulation
    simulationConfig.simulation.on('tick', function (){
        let tickLimit = ticksByNodeCount(nodes.length)

        if (numTicks < tickLimit) {
            link
                .attr("x1", function(d) {return d.source.x })
                .attr("y1", function(d) {return d.source.y })
                .attr("x2", function(d) {return d.target.x })
                .attr("y2", function(d) {return d.target.y })

            node
                .attr("cx", function(d) {return d.x })
                .attr("cy", function(d) {return d.y });

            label
                .attr('x', function(d) {return d.x + 12 })
                .attr('y', function(d) {return d.y + 4})
                .attr("transform", function(d,i){ return "rotate(0)"})


                numTicks++
            }   else {   
            ticksCompleted = true
        }

    })
    
    //restart simulation
    simulationConfig.simulation.nodes(nodes);
    simulationConfig.simulation.force("charge").strength(function() { return forceStrength(nodes.length)})
    simulationConfig.simulation.force("link").id(function (d) {return d.id}).distance(600)
    simulationConfig.simulation.force("link").links(links)
    simulationConfig.simulation.force("forceX").strength(.5)
    simulationConfig.simulation.force("forceY").strength(.5)
    simulationConfig.simulation.alpha(.1).restart();

}
function updateSidebarsDomain(data, domainTitle, simulationConfig) {
       
        //clear areas
        sidebarLeft.html("")
        sidebarRight.html("")

        sidebarLeft.style("display", "block")
        sidebarRight.style("display", "block")

        //**populate sidebarLeft**
        
        let domainText = sidebarLeft.append("div")

        // Title
        if (typeof(domainTitle)!=='undefined') {
            domainText.append("h3")
            .text(domainTitle)
            .classed('articleDetailH3',true)
        }

        let domainNodesCount = nodes.length
        let domainLinksCount = links.length
        let domainIntroHTML = `<p>SEP contains the following data for articles about ${domainTitle}.<br>` +
                                `Articles: ${domainNodesCount}<br>` +
                                 `Links: ${domainLinksCount}</p>`

        domainText.append("div")
            .html(domainIntroHTML)
            .classed('firstParagraph', true)

        //  Add nodes and links data


        //**populate sidebarRight**

        sidebarRight.append('H3')
            .text("List of Articles")
            .classed('articleDetailH3', true)

        let articleListArea = sidebarRight.append('div')
            .style('overflow', 'auto')
            .style('height', '600px')

        //sort nodes in alphabetical order
        nodes.sort((a,b) => d3.ascending(a.title, b.title))

            articleListArea.append("ul")
            .classed('domainListDetail', true)
            .selectAll(".domainArticle")
            .data(nodes)
            .enter()       
            .append("li")             
                .html(function(d) {return d.title})
                .classed('domainArticle', true)
            .exit().remove()

        ////// ux/ui interactions

        let domainArticleList = d3.selectAll('.domainArticle')
        
        domainArticleList.on('mouseover', function() {mouseOverDomainGraph(this, data, simulationConfig)})
        domainArticleList.on('mouseout', function() {mouseOutDomainGraph(this, data, simulationConfig)})
        domainArticleList.on('dblclick', function() {dblClickDomainGraph(this, data, simulationConfig)})

    
}
function dblClickDomainGraph(dblClickReference, data, simulationConfig) {
    // get node or label activated
    let activeElement = d3.select(dblClickReference)

    activeElement.style("cursor", "pointer"); 
    activeElement.style("font-weight", "bold")
    resetDisplayDefaultsArticleGraph();
    resetDisplayDefaultsDomainGraph();
    let articleTitle = activeElement.datum().title
    showArticleGraph(data, articleTitle, simulationConfig)
}
function mouseOverDomainGraph(mouseOverReference, data, simulationConfig) {
    // get node or label activated
    let activeElement = d3.select(mouseOverReference)

    activeElement.style("cursor", "pointer"); 
    activeElement.style("font-weight", "bold")
    focusOnDomainArticle(activeElement.datum())
    // updateSidebarsDomain(data, activeElement.datum().title, simulationConfig)
}
function mouseOutDomainGraph(mouseOutReference,data, simulationConfig) {
    // get node or label activated
    let activeElement = d3.select(mouseOutReference)

    activeElement.style("cursor", "default");
    activeElement.style("font-weight", "normal")
    resetDisplayDefaultsDomainGraph()
    // displayDetailsArticle(data, activeElement.datum(), simulationConfig)
}
function updateNeighborNodes() {
    neighborNodes.length = 0
    links.forEach(function (d) {
        neighborNodes[d.source.id + "-" + d.target.id] = true;
        neighborNodes[d.target.id + "-" + d.source.id] = true;
    });
}
function isNeighborNode(a, b) {
    return a == b || neighborNodes[a + "-" + b];
}
function focusOnDomainArticle(activeElement) {

    d3.selectAll('.link').attr("opacity", function (link) {
        // return link.source.index == activeElement.index || link.target.index == activeElement.index ? 1 : 0.1;
        return link.source.id === activeElement.id  || link.target.id === activeElement.id ? 1 : 0.1;
 
    });
    d3.selectAll('.label').attr("display", function (label) {
        return isNeighborNode(activeElement.id, label.id) ? "block" : "none";

    });
    d3.selectAll('.node').style("opacity", function (node) {
        return isNeighborNode(activeElement.id, node.id) ?  1 : 0.1;
    });
}
function resetDisplayDefaultsDomainGraph() {
    d3.selectAll('.link').attr("opacity", 0.3);
    d3.selectAll('.label').attr("display", "none");
    d3.selectAll('.node').style("opacity", 1);
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

    return _combinedLinks


}
function intersection(setA, setB) {
    let _intersection = new Set()
    for (let elem of setB) {
        if (setA.has(elem)) {
            _intersection.add(elem)
        }
    }
    return _intersection
}
function symmetricDifference(setA, setB) {
    let _difference = new Set(setA)
    for (let elem of setB) {
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
    if (numberOfNodes < 20) { strength = -1000 } else
    if (numberOfNodes < 30) { strength = -800 } else
    if (numberOfNodes < 40) { strength = -600 } else
    if (numberOfNodes < 50) { strength = -400 } else
    if (numberOfNodes < 60) { strength = -200 } else
    if (numberOfNodes < 70) { strength = -100 } else 
    if (numberOfNodes < 80) { strength = -50 } else 
    if (numberOfNodes < 90) { strength = -40 } else 
    if (numberOfNodes > 90) { strength = -30 } else 
    console.log(numberOfNodes)
    return strength

}
function ticksByNodeCount(numberOfNodes) {
    let tickLimit;
    if (numberOfNodes < 10) { tickLimit = 50 } else
    if (numberOfNodes < 20) { tickLimit = 80 } else
    if (numberOfNodes < 30) { tickLimit = 100 } else
    if (numberOfNodes < 40) { tickLimit = 150 } else
    if (numberOfNodes < 60) { tickLimit = 200 } else
    if (numberOfNodes < 70) { tickLimit = 250 } else 
    if (numberOfNodes < 80) { tickLimit = 200 } else 
    if (numberOfNodes < 90) { tickLimit = 250 } else 
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
function setXpos(distX,textwidth) {
    if ( distX > 0) {
        returnX = distX + 12
        // returnX = distX - textwidth - 12
    }   else {
        // returnX = distX + 12
        returnX = distX - textwidth - 12
    }
    return returnX
}
function color(entryType){
    let rgbValue = '';
    switch(entryType) {
        // traditional categories
        // purples
        case 'Aesthetics':
            rgbValue = 'rgb(202, 5, 237)'
            break;

        case 'Epistemology':
            rgbValue = 'rgb(159, 6, 186)'
            break;

        case 'Ethics and Morality':
            rgbValue = 'rgb(118, 7, 138)'
            break;

        case 'Metaphysics':
            rgbValue = 'rgb(191, 74, 212)'
            break;

        case 'Mind':
            rgbValue = 'rgb(217, 89, 240)'
            break;

        case 'Religion':
            rgbValue = 'rgb(226, 120, 245)'
            break;

        case 'Thinker':
            rgbValue = 'rgb(240, 240, 240)'
            break;

        // social and political philosophies
        // reds

        case 'Existentialism and Phenomenology':
        // browns
            rgbValue = 'rgb(138, 85, 44)'
            break;

        case 'Feminism':
            rgbValue = 'rgb(161, 101, 29)'
            break;

        case 'Law':
            rgbValue = 'rgb(207, 127, 31)'
            break;

        case 'Political and Social Theory':
            rgbValue = 'rgb(230, 139, 30)'
            break;

        // cultural philosophies
        // orange tones 
        case 'African and African-American Philosophy':
            rgbValue = 'rgb(247, 130, 5)'
            break;

        case 'Arabic and Islamic Philosophy':
            rgbValue = 'rgb(247, 150, 5)'
            break;

        case 'Chinese Philosophy':
            rgbValue = 'rgb(222, 168, 7'
            break;   

        case 'Indian Philosophy':
            rgbValue = 'rgb(222, 147, 7)'
            break;

        case 'Japanese Philosophy':
            rgbValue = 'rgb(222, 129, 7)'
            break;

        case 'Latin American Philosophy':
            rgbValue = 'rgb(247, 86, 5)'
            break;

        // scientific philosophies
        // blues
        case 'Biology':
            rgbValue = 'rgb(2, 6, 247)'
            break;

        case 'Computer Science':
            rgbValue = 'rgb(2, 247, 157)'
            break;

        case 'Economics':
            rgbValue = 'rgb(2, 247, 157)'
            break;

        case 'Evolution':
            rgbValue = 'rgb(2, 51, 247)'
            break;

        case 'Genetics':
            rgbValue = 'rgb(2, 100, 247)'
            break;

        case 'Physics':
            rgbValue = 'rgb(2, 157, 247)'
            break;    

        case 'Quantum Mechanics':
            rgbValue = 'rgb(2, 109, 247)'
            break;

        case 'Scientific Methods':
            rgbValue = 'rgb(2, 47, 247)'
            break;


        // langauge, logic, math
        // greens
        case 'Language':
            rgbValue = 'rgb(2, 247, 84)'
            break;

        case 'Logic':
            rgbValue = 'rgb(5, 168, 21)'
            break;

        case 'Mathematics':
            rgbValue = 'rgb(5, 168, 70)'
            break;

    }

    // if (entryType==='Thinker') {
    //     rgbValue = 'rgb(255, 255, 255)'
    // }   else    {
    //     rgbValue = 'rgb(255, 127, 14)'
    //     // rgbValue = 'rgb(255,255,0)'
    // }

    return rgbValue
}