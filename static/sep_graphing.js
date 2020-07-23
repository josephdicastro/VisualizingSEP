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
let graphNodes = [];
let graphLinks = [];

// Initialize SVG and Simulation
let svgConfig = initializeParentSVG(svg);
let simulationConfig = initializeSimulation(svgConfig);  
let stylesConfig = initializeStyles();

//Initialze article and domain caches for SEP data 
let articleSearchCache = [];
let domainSearchCache = [];

//
let neighborNodes = [];

let linkAngles = [];

//set BaseURL for SEP Edition
let sepEdition = "Spring 2020"
let baseURL = 'https://plato.stanford.edu/archives/spr2020';


startVisualization();

function startVisualization() {
    
    loadMenus();
    showArticleGraphAreas() 
    // showHomeMenu(data, simulationConfig)

    //UI Response features
    articleMenu.on('change', function(){
        let articleTitle = d3.event.target.value;
        if (articleTitle !== "[Search articles...]") { showArticleGraph(articleTitle)}
        showArticleGraph(articleTitle)
    })

    domainMenu.on('change', function(){
        let domainTitle = d3.event.target.value;
        if (domainTitle !== "[Search domains...]") { showDomainGraph(domainTitle)}
        
    })

    
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

    let areaWidth = 700;
    let areaHeight = 700;

    let width = areaWidth - margin.left - margin.right;
    let height = areaHeight - margin.top - margin.bottom;

    svg.attr("viewBox", "0 0 " + width + " " + height )
       .attr("preserveAspectRatio", "xMidYMid")
    //    .style("border", "1px solid white")

    //clear out child SVG elements
    svg.html("")

    //create SVG group centered in the middle of the svg space
    let g1 = svg.append('g')
                        .attr("transform", `translate(${width/2},${height/2})`)
                        .classed('articleGraphGroup', true)
    
    //create secondary svg group so that we can add our graph elements to this group
    let graph_elements = g1.append('g')
                            .classed('articleElements', true)
                            // .attr('width',1000)

    return {margin, areaWidth, areaHeight, width, height, graph_elements}
}

function initializeSimulation(svgConfig) {

    // create main graph elements
    let links = svgConfig.graph_elements
        .append("g")
        .classed('links',true)

    let labels = svgConfig.graph_elements
        .append("g")
        .classed('labels',true)

    let relatedLinks = svgConfig.graph_elements
        .append("g")
        .classed('relatedLinks', true)

    let nodes = svgConfig.graph_elements
        .append("g")
        .classed('nodes',true)



    let simulation = d3.forceSimulation()
        .force("charge", d3.forceManyBody())
        .force("link", d3.forceLink())
        .force("center", d3.forceCenter())
        .force("forceX", d3.forceX())
        .force("forceY", d3.forceY())
        .force("collide", d3.forceCollide())
        .alphaTarget(1);

    return {links, nodes, labels, relatedLinks, simulation}
}

function initializeStyles() {
    let link = { 
        'defaultOpacity': 0.3,
        'activeOpacity': 0.2,
        'inactiveOpacity': 0.05,
        'strokeColor': '#999',
        'strokeWidth':1}
    
    let nodelabel = {
        'defaultOpacity': 1,
        'centralNodeDimmedOpacity': 0.5,
        'inArrayOpacity': 0.75,
        'notInArrayOpacity': 0.05,
        'fontSize': '12px', 
        'defaultRadius': 4,
        'strokeColor': "#fff",
        'strokeWidth':0.5 
    }







    return {link, nodelabel}


}
// ****** MENU FUNCTIONS ********

function loadMenus() {
    d3.json('static/sep_network_test.json').then((json) => {
        //build article menu 
        let articleItems = ["[Search articles...]"]
        json.articles.nodes.forEach(node => articleItems.push(node.title))
        articleMenu.selectAll("option")
        .data(articleItems)
        .enter().append("option")
                .attr("value", (d) => d)
                .html((d) => d)

        //build domain menu
        let domainSet = new Set() 
        json.articles.nodes.forEach(node => domainSet.add(node.primary_domain))
        let domainItems = Array.from(domainSet)
        domainItems.sort((a,b) => d3.ascending(a, b));
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
}

function rewriteURL(entryTitle, entryURL) {

    console.log(entryTitle)
    console.log(entryURL)
    
    if (typeof(history.pushState) !== "undefined") {
        var url = { Title: entryTitle, Url: entryURL };
        history.pushState(url, url.Title, url.Url);
    }
}
// ****** ARTICLE GRAPH DATA AND SIMULATION FUNCTIONS ****** 

function setArticleMenuTitle(articleTitle) {
    articleMenu.property("value", articleTitle)
}
function setArticleTitle(selectedArticle) {
    let selectedArticleTitle = d3.select("#selectedEntryTitle").select("h1")
    selectedArticleTitle
        .text(selectedArticle.article)
        .style("color", function(d) {return color(selectedArticle.nodes[0].primary_domain)})
        .classed('selectedEntryTitle',true)

}
function showArticleGraph(articleTitle) {
    d3.json('/static/sep_network_test.json').then((json) => {
        let articleData = getArticleData(json,articleTitle)
        setGlobalNodesLinks(articleData)
        let articleNode = graphNodes[0]
        drawArticleSimulation(json)
        setArticleTitle(articleData)
        updateSidebarsArticle(json, articleNode);
        window.getSelection().removeAllRanges();
        setArticleMenuTitle(articleTitle)
        setDomainMenuTitle("[Search domains...]")

    })

}
function getArticleData(data, articleTitle) {
    let articleData = {};
    let inArticleCache = articleSearchCache.find( ({article}) => article === articleTitle);
    if (!inArticleCache) {
        articleData = getArticleDataFromJSON(data, articleTitle); 
    }   else    {
        articleData = inArticleCache
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
    articleSearchCache.push(articleData)

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
                           .attr('fill-opacity',stylesConfig.nodelabel.defaultOpacity)
                           .order()
                           .classed('mainLabel', function(d,i) {return i===0?true:false})
                           .attr("fill", function(d) {return color(d.primary_domain)})
    label.exit().remove();

    label = label.enter()
                 .append("text")
                 .text(function(d) {return d.title})
                 .attr('fill-opacity',stylesConfig.nodelabel.defaultOpacity)
                 .attr("font-size", stylesConfig.nodelabel.fontSize)
                 .attr("fill", function(d) {return color(d.primary_domain)})
                 .attr('nodeID', function(d) {return d.id})
                 .classed('label',true)
                 .classed('mainLabel', function(d,i) {return i===0?true:false})
                 .merge(label)

    label
        .on('mouseover', function() {mouseOverArticleNode(this, data,centralNode)})
        .on('mouseout', function() {mouseOutArticleNode(this, data, centralNode)})
        .on('dblclick', function() {dblClickArticleNode(this)})


    //nodes
    node = simulationConfig.nodes.selectAll('.node')
                         .data(graphNodes, function (d) {return d.id})
                         .order()
                         .attr("r", 5)
                         .attr("fill", function(d) {return color(d.primary_domain)})
    
    node.exit().remove()

    node = node.enter()
                .append('circle')
                .attr("r", stylesConfig.nodelabel.defaultRadius)
                .attr("fill", function(d) {return color(d.primary_domain)})
                .attr("stroke", stylesConfig.nodelabel.strokeColor)
                .attr("stroke-width", stylesConfig.nodelabel.strokeWidth)
                .attr('nodeID', function(d) {return d.id})
                .style('opacity',stylesConfig.nodelabel.defaultOpacity)
                .classed('node',true)
                .merge(node)
    node
        .on('mouseover', function() {mouseOverArticleNode(this, data, centralNode)})
        .on('mouseout', function() {mouseOutArticleNode(this, data, centralNode)})
        .on('dblclick', function() {dblClickArticleNode(this)})

    //update simulation ticker
    let numTicks = 0;
    let ticksCompleted = false;
    simulationConfig.simulation.on('tick', function (){
        let tickLimit = ticksByNodeCount(countOfNodes)
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
                .attr('x', function(d) {return d.index === 0 ? 0: setArticleXpos(d.x,this.getBBox().width) })
                .attr('y', function(d) {return d.index === 0 ? -10: d.y+4})
                .attr("transform", function(d,i){ return i===0 ?`rotate(0)`:rotateLabel(i,d.x, d.y)})

                numTicks++
            }   else {   
            ticksCompleted = true
        }

    })

    //update simulations
    simulationConfig.simulation.nodes(graphNodes);
    simulationConfig.simulation.force("charge").strength(function() { return forceStrength(countOfNodes)})
    simulationConfig.simulation.force("link").id(function (d) {return d.id})
                                             .distance(200)
    simulationConfig.simulation.force("link").links(graphLinks)
    simulationConfig.simulation.force("forceX").strength(0)
    simulationConfig.simulation.force("forceY").strength(0)
    simulationConfig.simulation.force("collide").radius(0)

    simulationConfig.simulation.alpha(1).restart();



}

// ****** ARTICLE GRAPH SIDEBAR  ****** 

function clearSidebar(sidebarToClear) {
    sidebarToClear.html("")
    sidebarToClear.style("display", "block")
}
function updateSidebarsArticle(data, selectedArticle) {
    updateSideBarLeft_ArticleMain(selectedArticle)
    updateSideBarRight_ArticleMain(data, selectedArticle)

}

function updateSideBarLeft_ArticleMain(selectedArticle, relatedArticles){

    if(selectedArticle) {

        clearSidebar(sidebarLeft)

        let sideBarLeftContent = sidebarLeft.append("div");

        setArticleIntroParagraph(sideBarLeftContent, "Introduction Text", selectedArticle);
        setArticleDomainDetails(sideBarLeftContent, selectedArticle.domain_tags);
        setArticleReadAtSep(sideBarLeftContent, selectedArticle);
    }
}

function updateSideBarLeft_ArticlePreview(selectedArticle, relatedArticles) {
    if(selectedArticle) {

        clearSidebar(sidebarLeft)

        let sideBarLeftContent = sidebarLeft.append("div");

        setArticleIntroParagraph(sideBarLeftContent, "Preview", selectedArticle);
        setArticleDomainDetails(sideBarLeftContent, selectedArticle.domain_tags);
        setArticleRelatedLinks(sideBarLeftContent, selectedArticle, relatedArticles);
    }

}

function setArticleIntroParagraph(parentSidebar, introText, selectedArticle) {

    let introParagraphPanel = parentSidebar.append("div")
    introParagraphPanel.classed('panelBG', true)

    //test if this is a main entry heading or a preview heading
    if ( introText === 'Introduction Text') {
        introParagraphPanel.append("h2")
            .text('Introduction Text')
            .classed('panelHeading', true)
    }   else {
        introParagraphPanel.append("h2")
            .text(`${selectedArticle.title} (Preview)`)
            .classed('panelHeading', true)
            .style('color', function() {return color(selectedArticle.primary_domain)})
    }

    //build paragraph
    if (typeof(selectedArticle.first_paragraph)!=='undefined') {
        let paragraphDiv = introParagraphPanel.append("div")
        let paragraphData = getParagraphDataHTML(selectedArticle.first_paragraph);
        paragraphDiv
            .html(paragraphData)
            .classed('panelParagraphText', true)
    }
}

function setArticleDomainDetails(parentSidebar, domainArray) {
    let domainListDiv = parentSidebar.append("div")


    domainListDiv.classed('panelBG', true)
    domainListDiv.append("h2")
        .text("Domains")
        .classed('panelHeading', true)

    domainListDiv.append("ul")
        .selectAll(".domainListItem")
        .data(domainArray.split(','))
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

}

function setArticleReadAtSep(parentSidebar, selectedArticle) {
    let sepLinkDiv = parentSidebar.append("div")

    sepLinkDiv
        .classed('panelBG', true)

    let sepURL = baseURL + selectedArticle.id

    sepLinkDiv.append('h2')
        .text('Read the full article at SEP')
        .classed('panelHeading', true)

    sepLinkDiv.append("p")
        .html(`<a href="${sepURL}" target="_blank">${selectedArticle.title}</a>`)
        .classed('sepLink', true)
        .style('color', 'white')
}

function setArticleRelatedLinks(parentSidebar, selectedArticle, relatedArticles) {
    let relatedLinksDiv = parentSidebar.append("div")

    if (typeof(relatedArticles) !== "undefined") {
            relatedLinksDiv.html("")
            relatedLinksDiv.classed('panelBG', true);
            let numRelated = (relatedArticles.length > 1) ?  relatedArticles.length - 1 : 0;

            // relatedLinksDiv.append("h2")
            //     .text(`Shared Links "${graphNodes[0].title}"`)    
            //     .classed('panelHeading', true)

            let relatedLinksParagraph = relatedLinksDiv.append("p")

            relatedLinksParagraph.append("span")
                .html(`<span class="badge badge-pill badge-light">${numRelated}</span> shared Links with`)
                .style('color', 'white')
                .classed('linksSharedText', true)
            
            relatedLinksParagraph.append('span')
                .html(` ${graphNodes[0].title}`)   
                .style('color', function() { return color(graphNodes[0].primary_domain)})
                .classed('linksSharedText', true)

     }  else {
        relatedLinksDiv.html("")
     } 
}

function setArticleRelatedLinks_old(parentSidebar, selectedArticle, relatedArticles) {

    let relatedLinksDiv = parentSidebar.append("div")

    if (typeof(relatedArticles) !== "undefined") {
        if (relatedArticles.length > 1 ) {

            relatedLinksDiv.html("")
            relatedLinksDiv.classed('panelBG', true)

            relatedLinksDiv.append("h2")
                .text(`Links shared with "${graphNodes[0].title}"`)    
                .classed('panelHeading', true)
        
            let relatedLinksList = relatedLinksDiv.append("div")
            relatedLinksList
                .attr("id","relatedLinksList")
            
            relatedArticles.splice(relatedArticles.lastIndexOf(selectedArticle),1)
            relatedLinksList.append("ul")
                .selectAll(".relatedLinkItems")
                .data(relatedArticles)
                    .enter()
                    .append('li')
                    .html(function(d) {return d.title})
                    .style("color", function(d) {return color(d.primary_domain)})
                    .classed('relatedLinkItems', true)
                    .classed('panelListItem', true)
                .exit().remove()

                
        }

    }   else {
        relatedLinksDiv.html("")
    }

} 

function updateSideBarRight_ArticleMain(data, selectedArticle){
    if(selectedArticle) {

        let articleData = getArticleData(data,selectedArticle.title);

        clearSidebar(sidebarRight);

        let sidebarRightContent = sidebarRight.append("div");

        setLinkCountPanel(sidebarRightContent,articleData, data);
        setLinkDirectionPanel(sidebarRightContent, articleData);
        setLinkDomainPanel(sidebarRightContent, articleData);
    }
}

function setLinkCountPanel(parentSidebar, articleData, data) {

    let linkCountDiv = parentSidebar.append("div")

    linkCountDiv
        .classed("panelBG", true)  
        .classed("linkCountDiv", true)

    linkCountDiv.append("h2")
        .html(`<span class="badge badge-pill badge-light">${articleData.links.length}</span> Linked Articles`)
        .classed('linkCountText', true)

    // build list of articles 
    let articleLinksDiv = linkCountDiv.append("div")

    let showHide = articleLinksDiv.append("p")
        .text("(show)")
        .classed('showArticleList', true)

    let articleListDiv = articleLinksDiv.append("div")
        .attr("id", "articleListDiv")
        .style("display", "none")

    articleListDiv.append("h2")
        .text("List of Articles")
        .classed('panelHeading', true)

    let articleNodesCleaned = [] 
    articleData.nodes.forEach(node=> {
        if (node.index !== 0 ) {articleNodesCleaned.push(node)}
    })
    articleNodesCleaned.sort((a,b) => d3.ascending(a.title, b.title))

    articleListDiv.append("ul")
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
        .on('mouseover', function() { mouseOverArticleNode(this, data)})
        .on('mouseout', function()  { mouseOutArticleNode(this, data)})
        .on('dblclick', function()  { dblClickArticleNode(this)})
    showHide
        .on('mouseover', function() { activateItemLink(this) })
        .on('mouseout', function()  { deActivateItemLink(this) })
        .on('dblclick', function()  { toggleArticleListVisibility(this)})
}

function setLinkDirectionPanel(parentDiv, articleData) {

    let directionLinksPanel = parentDiv.append("div")
    directionLinksPanel
        .classed('panelBG', true)

    directionLinksPanel.append("h2")
        .text("Link Direction Summary")
        .classed('panelHeading', true)

    let directionLinksListDiv = directionLinksPanel.append("div")
    directionLinksListDiv
        .attr("id", "directionLinksListDiv")
        .attr("display", "block")

    linkItems = [`Bi-Directional <span class="badge badge-pill badge-light">${articleData.biLinks.size}</span>`,
                    `In-Coming <span class="badge badge-pill badge-light">${articleData.inLinks.size}</span>`,
                    `Out-Going <span class="badge badge-pill badge-light">${articleData.outLinks.size}</span>`]

    directionLinksListDiv.append("ul")
        .selectAll(".linkDirListItem")
        .data(linkItems)
        .enter()
        .append('li')
        .html(function(d) {return d})
        .style('color', 'white')
        .classed('linkDirListItem', true)
        .classed('panelListItem', true)
    .exit().remove()

        ////// ux/ui interactions

    let listLinkDirection = d3.selectAll('.linkDirListItem')
    listLinkDirection
        .on('mouseover', function() {
            activateItemLink(this)
            let linkDirection = d3.select(this).datum().substring(0,2)
            switch(linkDirection) {
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

        })
        .on('mouseout', function() {
            deActivateItemLink(this)
            resetDisplayDefaultsArticleGraph();
        })

}

function setLinkDomainPanel(parentSidebar, articleData) {
    // build domain links data 
    let domainLinksPanel = parentSidebar.append("div")
    domainLinksPanel
        .classed('panelBG', true)

    domainLinksPanel.append("h2")
        .text("Link Domain Summary")
        .classed('panelHeading', true)  

    let domainLinksListDiv = domainLinksPanel.append("div")
    domainLinksListDiv
        .attr("id", "domainLinksListDiv")
        .attr("display", "block")
    
    domainLinksListDiv.append("ul")
        .selectAll(".linkDomainListItem")
        .data(articleData.linkDomains)
        .enter()
        .append('li')
        .html(function(d) {return `${d[0]} <span class="badge badge-bill badge-light">${d[1]}</span>`})
        .style("color", function(d) {return color(d[0])})
        .classed('linkDomainListItem', true)
        .classed('panelListItem', true)
    .exit().remove()

    // setup UI interactions
    let listlinkDomains = d3.selectAll('.linkDomainListItem')
    listlinkDomains
        .on('mouseover', function() {
            activateItemLink(this)
            let linkDomainArray = getDomainLinksInArticle(d3.select(this).datum())
            focusOnLinkAnalysis(linkDomainArray)
        
        })
        .on('mouseout', function() {
            deActivateItemLink(this);
            resetDisplayDefaultsArticleGraph();
        })
}

function toggleArticleListVisibility(dblClickReference) {
    let toggleState = d3.select(dblClickReference)
    let articleListDiv = d3.select("#articleListDiv")
    let directionListDiv = d3.select("#directionLinksListDiv")
    let domainListDiv = d3.select("#domainLinksListDiv")

    if (toggleState.node().innerHTML === "(show)") {
        toggleState.node().innerHTML = "(hide)"
        articleListDiv.style("display", "block")
        directionListDiv.style("display", "none")
        domainListDiv.style("display", "none")

    }   else {
        toggleState.node().innerHTML = "(show)"
        articleListDiv.style("display", "none")
        directionListDiv.style("display", "block")
        domainListDiv.style("display", "block")
    }
}

function activateItemLink(mouseReference) {
    d3.select(mouseReference)
        .style("cursor", "pointer")
        // .style("font-weight", "bold")
        .style("list-style", "disc");
}
function deActivateItemLink(mouseReference) {
    d3.select(mouseReference)
        .style("cursor", "normal")
        // .style("font-weight", "normal")
        .style("list-style", "none");
}
function getDomainLinksInArticle(linkDomain) {
    let domainArray = []
    graphNodes.filter(node => {
        if (node.primary_domain === linkDomain[0]) { domainArray.push(node.id)}
    })
    return domainArray
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
function dblClickArticleNode(dblClickReference) {
    
    // get node or label activated
    let activeElement = d3.select(dblClickReference)

    if (activeElement.datum().index !== 0) {
    // do the following if the activated node or label was not the central node

        activeElement.style("cursor", "pointer"); 
        resetDisplayDefaultsArticleGraph();
        let articleTitle = activeElement.datum().title
        showArticleGraph(articleTitle)
    }
}
function mouseOverArticleNode(mouseOverReference, data) {
    
    // get node or label activated
    let activeElement = d3.select(mouseOverReference)

    if (activeElement.datum().index !== 0) {
    
        // do the following if the activated node or label was not the central node
        activateItemLink(mouseOverReference)
        let relatedArticles = getRelatedArticles(data,activeElement.datum())

        focusOnArticleNode(data, activeElement.datum())
        updateSideBarLeft_ArticlePreview(activeElement.datum(), relatedArticles)

    }
}
function mouseOutArticleNode(mouseOverReference, data) {
    let activeElement = d3.select(mouseOverReference)
    let centralNode = graphNodes[0]
    
    deActivateItemLink(mouseOverReference)
    simulationConfig.relatedLinks.html("")
    resetDisplayDefaultsArticleGraph();
    updateSideBarLeft_ArticleMain(centralNode)

}

function getNodeCenter(activeElement) {
    let _selectedNode = d3.selectAll(".node")
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
    linkLinesGroup.html("")
    
    let startX = getNodeCenter(activeElement).attr("cx")
    let startY = getNodeCenter(activeElement).attr("cy")

    let linkLines = linkLinesGroup.selectAll(".relatedLinkLines")
        .data(relatedArticles)
    linkLines.exit().remove()
    linkLines = linkLines.enter()
                .append('line')
                .attr("x1", startX)
                .attr("y1", startY)
                .attr("x2", function (d) {return getNodeCenter(d).attr("cx")})
                .attr("y2", function (d) {return getNodeCenter(d).attr("cy")})
                .classed("relatedLinkLines", true)
                .merge(linkLines)



    let relatedArticleIDs = relatedArticles.map(article => article.id)

    // reduce link opacity for all non-activated links
    d3.selectAll('.link').
        each(function (d,i) {
            d3.select(this)
            .attr("opacity", function (link) { 
                return link.target.id === activeElement.id ? stylesConfig.link.activeOpacity : stylesConfig.link.inactiveOpacity
            })
    });

    d3.selectAll('.label')
        .each(function (d,i) {
            d3.select(this)
                .attr("fill-opacity", function(label) { return setNodeLabelOpacity(label, relatedArticleIDs, activeElement)})
        })
        
    d3.selectAll('.node')
        .each(function (d,i) {
            d3.select(this)
                .style("opacity", function(node) { return setNodeLabelOpacity(node, relatedArticleIDs, activeElement)})
    })


}

function focusOnLinkAnalysis(linksReference) {
    if (linksReference.length > 0 ) {
        d3.selectAll(".link")
        .each(function (d,i) {
            let match = linksReference.includes(d.target.id)
            d3.select(this)
                .attr("opacity", match ? stylesConfig.link.activeOpacity : stylesConfig.link.inactiveOpacity)
        })

    
        d3.selectAll('.label')
        .each(function (d,i) {
            d3.select(this)
                .attr("fill-opacity", function(label) { return setNodeLabelOpacity(label, linksReference)})
        })

        d3.selectAll('.node')
        .each(function (d,i) {
            d3.select(this)
                .style("opacity", function(node) { return setNodeLabelOpacity(node, linksReference)})
        })
    }


}

function setNodeLabelOpacity(selectedElement, elementsArray, activeElement) {
    let _opacityValue;

    if (elementsArray.includes(selectedElement.id)) {_opacityValue = stylesConfig.nodelabel.inArrayOpacity}
    if (!elementsArray.includes(selectedElement.id)) {_opacityValue = stylesConfig.nodelabel.notInArrayOpacity}
    if (selectedElement.index === 0) {_opacityValue = stylesConfig.nodelabel.centralNodeDimmedOpacity}
    if (typeof(activeElement) !== 'undefined') {
        if (selectedElement.id === activeElement.id) { _opacityValue = stylesConfig.nodelabel.defaultOpacity}
    }

    return _opacityValue

}

function resetDisplayDefaultsArticleGraph() {
    d3.selectAll('.link').attr("opacity", stylesConfig.link.defaultOpacity);
    d3.selectAll('.label').attr("fill-opacity", stylesConfig.nodelabel.defaultOpacity);
    d3.selectAll('.node').style("opacity", stylesConfig.nodelabel.defaultOpacity);
    d3.selectAll('.relatedLinkLines').style("opacity",0)
} 

// ****** DOMAIN GRAPH FUNCTIONS ****** 

function setDomainMenuTitle(domainTitle) {
    domainMenu.property("value", domainTitle)
}
function showDomainGraph(domainTitle) {

    d3.json('static/sep_network_test.json').then(function(data) {
        
        let domainData = getDomainData(data,domainTitle)
        setGlobalNodesLinks(domainData)
        drawDomainSimulation(data, domainData)
        updateSidebarsDomainLeft(data, domainData);
        updateSidebarsDomainRight(data, domainData);
        updateNeighborNodes();
        setDomainMenuTitle(domainTitle)
        setArticleMenuTitle("[Search articles...]")
        window.getSelection().removeAllRanges();
    });
}
function getDomainData(data, domainTitle) {
    let domainData = {};
    let inDomainCache = domainSearchCache.find( ({domain}) => domain === domainTitle);
    if (!inDomainCache) {
        domainData = getDomainDataFromJSON(data, domainTitle); 
    }   else    {
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

    domainSearchCache.push(domainData)

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

    //labels
    label = simulationConfig.labels.selectAll('.label')
                           .data(graphNodes, function(d) {return d.title})
                            .attr('fill-opacity',0)
                           .attr("fill", function(d) {return color(d.primary_domain)})
    label.exit().remove();

    label = label.enter()
                 .append("text")
                 .text(function(d) {return d.title})
                 .attr('fill-opacity',0)
                 .attr("font-size", stylesConfig.nodelabel.fontSize)
                 .attr("fill", function(d) {return color(d.primary_domain)})
                 .attr('nodeID', function(d) {return d.id})
                 .classed('label',true)
                 .classed('mainLabel', function(d,i) {return i===0?true:false})
                 .merge(label)

    label.on('mouseover', function() {mouseOverDomainNode(this, data, domainData)})
    label.on('mouseout', function() {mouseOutDomainNode(this, data, domainData)})
    label.on('dblclick', function() {dblClickDomainNode(this, data)})
             
    let numLinksRange = graphNodes.map(node=>node.numLinks)
    let scaleNodeRadius = d3.scaleLinear()
        .domain([d3.min(numLinksRange), d3.max(numLinksRange)])
        .range([2,15])

    //nodes
    node = simulationConfig.nodes.selectAll('.node')
                         .data(graphNodes, function (d) {return d.id})
                         .attr("r", function(d) {return scaleNodeRadius(d.numLinks)})
                         .attr("fill", function(d) {return color(d.primary_domain)})
    
    node.exit().remove()

    node = node.enter()
                .append('circle')
                .attr("r", function(d) {return scaleNodeRadius(d.numLinks)})
                .attr("fill", function(d) {return color(d.primary_domain)})
                .attr("stroke", stylesConfig.nodelabel.strokeColor)
                .attr("stroke-width",  stylesConfig.nodelabel.strokeWidth)
                .attr('nodeID', function(d) {return d.id})
                .style('opacity',1)
                .classed('node',true)
                .merge(node)

    node.on('mouseover', function() {mouseOverDomainNode(this, data, domainData)})
    node.on('mouseout', function() {mouseOutDomainNode(this, data, domainData)})
    node.on('dblclick', function() {dblClickDomainNode(this, data)})

    //update simulation
    let numTicks = 0;
    let ticksCompleted = false;
    simulationConfig.simulation.on('tick', function () {
        let tickLimit = ticksByNodeCount(countOfNodes)

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
                .attr('x', function(d) {return setDomainXpos(d.x,scaleNodeRadius(d.numLinks),this.getBBox().width) })
                .attr('y', function(d) {return d.y + 4})
                .attr("transform", function(d,i){ return "rotate(0)"})


                numTicks++
            }   else {   
            ticksCompleted = true
        }

    })
    
    //restart simulation
    simulationConfig.simulation.nodes(graphNodes);
    simulationConfig.simulation.force("charge").strength(function() { return forceStrength(countOfNodes)})
    simulationConfig.simulation.force("link").id(function (d) {return d.id}).distance(500)
    simulationConfig.simulation.force("link").links(graphLinks)
    simulationConfig.simulation.force("forceX").strength(.5)
    simulationConfig.simulation.force("forceY").strength(.5)
    simulationConfig.simulation.force("collide").radius(20)
    simulationConfig.simulation.alpha(.1).restart();

}
function updateSidebarsDomain(data, domainTitle) {
    updateSidebarsDomainLeft(data, domainTitle);
    updateSidebarsDomainRight(data, domainTitle);
}

function updateSidebarsDomainLeft(data, domainData, articleNode){
    if(domainData) {
        //clear areas
        sidebarLeft.html("")
        sidebarLeft.style("display", "block")

        let sideBarLeftContent = sidebarLeft.append("div")
            .classed("sidebarContent", true)
        
        let introAreaDiv = sideBarLeftContent.append("div")

        // Title
        introAreaDiv.append("h3")
            .text(domainData.domain)
            .style("color", function(d) {return color(domainData.domain)})
            .classed('articleDetailH3',true)
        
        introAreaDiv.append("p")
            .text("Domain Text to Follow")
            .classed('mainText', true)

        //create div to list central nodes 
        let centralNodesDiv = sideBarLeftContent.append("div")

        centralNodesDiv.append("h5")
            .text("Central Nodes")
            .classed('articleDetailH5', true)
        
        centralNodesDiv.append("p")
            .text("The following articles are the most connected in this domain.")
            .classed("mainText", true)

        //sort domain nodes from most links to least, and then add the top 5 nodes to the centralNodes array
        domainData.nodes.sort((a,b) => d3.descending(a.numLinks, b.numLinks))
        let centralNodes = [];
        domainData.nodes.forEach((node,index) => {
            if (index < 5 ) {
                centralNodes.push(node)
            }
        })
        centralNodesDiv.append("ul")
            .selectAll(".centralNodeArticles")
            .data(centralNodes)
                .enter()
                .append('li')
                .html(function(d) {return d.title})
                .style("color", function(d) {return color(d.primary_domain)})
                .classed('centralNodeArticles', true)

        //create div to hold related links
        if(typeof(articleNode)!=="undefined") {
            let articlePreviewDiv = sideBarLeftContent.append("div")
            articlePreviewDiv.append("h5")
                .text("Article Preview")
                .classed('articleDetailH5', true)

        }

        // let relatedLinksDiv = articleDetails.append("div")


        // if (typeof(relatedArticles) !== "undefined") {
        //     if (relatedArticles.length > 1 ) {
        //         sepLinkDiv.html("")

        //         relatedLinksDiv.append("h5")
        //             .text(`Links shared with "${graphNodes[0].title}"`)    
        //             .classed('articleDetailH5', true)
                
        //         let relatedLinksList = relatedLinksDiv.append("div")
        //         relatedLinksList
        //             .attr("id","relatedLinksList")
                
        //         relatedArticles.splice(relatedArticles.lastIndexOf(selectedArticle),1)
        //         relatedLinksList.append("ul")
        //             .selectAll(".relatedLinkItems")
        //             .data(relatedArticles)
        //                 .enter()
        //                 .append('li')
        //                 .html(function(d) {return d.title})
        //                 .style("color", function(d) {return color(d.primary_domain)})
        //                 .classed('relatedLinkItems', true)
        //             .exit().remove()

                    
        //     }

        // }   else {pyth
        //     relatedLinksDiv.html("")
        // }
        
        // ////// ux/ui interactions
        ////// these need to be updated. these are overwriting the sidebar as they interact with it
        let centralNodesList = d3.selectAll('.centralNodeArticles')
        centralNodesList.on('mouseover', function() { activateItemLink(this); focusOnDomainArticle(d3.select(this).datum())/*mouseOverDomainNode(this, data, domainData)*/})
        centralNodesList.on('mouseout', function() { deActivateItemLink(this); resetDisplayDefaultsDomainGraph();/*mouseOutDomainNode(this, data, domainData)*/})
        centralNodesList.on('dblclick', function() {dblClickDomainNode(this, data)})
    }
}
function updateSidebarsDomainRight(data, domainData) {
    
    //clear areas
    sidebarRight.html("")
    sidebarRight.style("display", "block")

    let sidebarRightContentDiv = sidebarRight.append("div")
    
    // Title
    if (typeof(domainData.domain)!=='undefined') {
        //create domain stats div 
        let domainStatsDiv = sidebarRightContentDiv.append("div")
        domainStatsDiv.append("h3")
            .text(domainData.domain)
            .classed('articleDetailH3',true)

        let domainStatsHTML = `<p>There are ${domainData.nodes.length} articles in this domain.</p>` +
                              `<p>Articles may appear in multiple domains, so they are colored by the article's <em>primary</em> domain designation in the graph.`
        domainStatsDiv.append("div")
            .html(domainStatsHTML)
            .classed('mainText', true)

        // create domain article list div
        let domainArticleListDiv = sidebarRightContentDiv.append("div")
        domainArticleListDiv.append('H4')
            .text("List of Articles")
            .classed('articleDetailH4', true)

        let articleListAreaDiv = domainArticleListDiv.append('div')
            .classed("overflow500", true)

        //sort nodes in alphabetical order
        domainData.nodes.sort((a,b) => d3.ascending(a.title, b.title))

        articleListAreaDiv.append("ul")
            // .classed('domainListDetail', true)
            .selectAll(".domainArticle")
            .data(domainData.nodes)
            .enter()       
            .append("li")             
                .html(function(d) {return d.title})
                .classed('domainArticle', true)
            .exit().remove()

        ////// ux/ui interactions

        let domainArticleList = d3.selectAll('.domainArticle')
        
        domainArticleList.on('mouseover', function() {mouseOverDomainNode(this, data, domainData)})
        domainArticleList.on('mouseout', function() {mouseOutDomainNode(this, data, domainData)})
        domainArticleList.on('dblclick', function() {dblClickDomainNode(this, data)})

    }
}
function dblClickDomainNode(dblClickReference) {
    // get node or label activated
    let activeElement = d3.select(dblClickReference)
    activeElement
        .style("cursor", "pointer")
        .style("font-weight", "bold")
    
    resetDisplayDefaultsDomainGraph();
    resetDisplayDefaultsArticleGraph();

    let articleTitle = activeElement.datum().title
    showArticleGraph(articleTitle)
}
function mouseOverDomainNode(mouseOverReference, data, domainTitle) {
    activateItemLink(mouseOverReference)
    let selectedArticle = d3.select(mouseOverReference).datum()
    focusOnDomainArticle(selectedArticle);
    updateSidebarsDomainLeft(data,domainTitle, selectedArticle)

}
function mouseOutDomainNode(mouseOutReference, data, domainTitle) {
    deActivateItemLink(mouseOutReference)
    updateSidebarsDomainLeft(data,domainTitle)
    resetDisplayDefaultsDomainGraph();
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
console.log(activeElement)
    d3.selectAll('.link').attr("opacity", function (link) {
        return link.source.id === activeElement.id  || link.target.id === activeElement.id ? stylesConfig.link.activeOpacity : stylesConfig.link.inactiveOpacity;
 
    });
    d3.selectAll('.label').attr("fill-opacity", function (label) {
        return isNeighborNode(activeElement.id, label.id) ? stylesConfig.nodelabel.defaultOpacity : stylesConfig.nodelabel.notInArrayOpacity;

    });
    d3.selectAll('.node').style("opacity", function (node) {
        return isNeighborNode(activeElement.id, node.id) ?  stylesConfig.nodelabel.defaultOpacity : stylesConfig.nodelabel.notInArrayOpacity;
    });
}
function resetDisplayDefaultsDomainGraph() {
    d3.selectAll('.link').attr("opacity", stylesConfig.link.defaultOpacity);
    d3.selectAll('.label').attr("fill-opacity", 0);
    d3.selectAll('.node').style("opacity", stylesConfig.nodelabel.defaultOpacity);
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
function setArticleXpos(distX,textwidth) {
    if ( distX > 0) {
        returnX = distX + 12
    }   else {
        returnX = distX - textwidth - 12
    }
    return returnX
}
function setDomainXpos(distX, radiusScale ,textwidth) {
    if ( distX > 0) {
        returnX = distX + 5 + radiusScale
    }   else {
        returnX = distX - 5 - textwidth - radiusScale
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