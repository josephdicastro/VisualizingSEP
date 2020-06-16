let svg = d3.select('svg')
let articleMenu = d3.select('#articleSearchMenu')
let domainMenu = d3.select('#domainSearchMenu')
let introDiv = d3.select('#intro')
let articleGraphDiv = d3.select('#articleGraph')

let svgConfig = initializeParentSVG(svg);
let nodes = [];
let links = [];
let articleSearchCache = [];

let linkAngles = [];

let baseURL = 'https://plato.stanford.edu/archives/spr2020';

d3.json('static/sep_network_test.json').then(function(data) { showData(data)} );

function showData(data) {
    let articleSimulationConfig = initializeSimulation(svgConfig);  
    loadArticleMenu(data.articles)
    loadDomainMenu(data.domains)
    showArticleGraphAreas() 
    showHomeMenu(data, articleSimulationConfig)

    //UI Response features
    articleMenu.on('change', function(){
        let articleTitle = d3.event.target.value; 
        showArticleGraphAreas() 
        updateGraph(data, 'article', articleTitle, articleSimulationConfig)
    })

    domainMenu.on('change', function(){
        let domainTitle = d3.event.target.value;
        // let domainSimulationConfig = initializeDomainSimulation(svgConfig);  
        updateGraph(data, 'domain', domainTitle, articleSimulationConfig)
        
    })

}

function setGlobalNodesLinks(sepNetworkObject) {
    nodes.length = 0
    links.length = 0

    sepNetworkObject.nodes.forEach(node => nodes.push(node))
    sepNetworkObject.links.forEach(link => links.push(link))
}

function showHomeMenu(data, simulationConfig) {
    sep_node = data.domains.nodes
    sep_node.forEach(node => nodes.push(node))
    sep_node[0].links.forEach(link => links.push(link))
    drawArticleSimulation(data, simulationConfig)

}

function loadArticleMenu(data) {

    let articles = ["[Search articles...]"]
    data.nodes.forEach(node => articles.push(node.title))

    //load into article search menu
    articleMenu.selectAll("option")
                .data(articles)
                .enter().append("option")
                        .attr("value", (d) => d)
                        .html((d) => d)

}

function loadDomainMenu(data) {

    let domains = ["[Search domains...]"]
    data.nodes.forEach(node => domains.push(node.title))
    //load into searchMenu
    domainMenu.selectAll("option")
                .data(domains)
                .enter().append("option")
                        .attr("value", (d) => d)
                        .html((d) => d)

}


function showArticleGraphAreas() {
    introDiv.style('display', 'none')
    articleGraphDiv.style('display', 'block')
}

function initializeParentSVG(svg) {
    // set basic SVG Config data 
    let margin = {
        top: 100,
        right: 50,
        bottom:50,
        left:100
    };

    // let areaWidth = 900;
    let areaWidth = 1200
    let areaHeight = 1000;

    let width = areaWidth - margin.left - margin.right;
    let height = areaHeight - margin.top - margin.bottom;

    svg.attr("viewBox", "0 0 " + width + " " + height )
       .attr("preserveAspectRatio", "xMidYMid meet")
       .style('border', '1px solid white');

    // svg.attr("width", width)
    //     .attr('height',height )

    return {margin, areaWidth, areaHeight, width, height, svg}
}

function initializeSimulation(svgConfig) {
    //clear out child SVG elements
    svgConfig.svg.html("")

    //create SVG group centered in the middle of the svg space
    svg = svgConfig.svg.append('g')
                       .attr("transform", `translate(${(svgConfig.width/2)-25},${svgConfig.height/2})`)
                       .classed('articleGraphGroup', true)

    //create secondary svg group so that we can add our graph elements to this group
    let graph_elements = svg.append('g')
                            .classed('articleElements', true)

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

    label.exit().remove();

    label = label.enter()
                 .append("text")
                 .text(function(d) {return d.title})
                 .attr("display", "block")
                 .attr("font-size", '10px')
                 .attr("fill", function(d) {return color(d.entry_type)})
                 .attr('nodeID', function(d) {return d.id})
                 .classed('label',true)
                 .classed('mainLabel', function(d,i) {return i===0?true:false})
                 .merge(label)

    label.on('mouseover', function(d,i) { 
            if (i!==0) {
                if (ticksCompleted) {
                    focus(); 
                    d3.select(this).style("cursor", "pointer"); 
                    setPreviewArea(d3.select(d3.event.target).datum())
                }
            }
        })
        .on('mouseout', function(d,i)  { 
            if (i!==0) {
                if(ticksCompleted) {
                    unfocus(); 
                    d3.select(this).style("cursor", "default"); 
                    setPreviewArea(centralNode);
                }
            }
        })
        .on('dblclick', function(d,i) {
            if (i!==0) {
                if (ticksCompleted) {
                    unfocus();
                    let articleTitle = d.title
                    articleMenu.property('value',articleTitle)
                    if (d.entry_type === 'Menu') {
                        updateGraph(data, 'domain', articleTitle, simulationConfig)
                    }   else    { 
                        updateGraph(data, 'article', articleTitle, simulationConfig)
                    }
                }
            }

        })

    //nodes
    node = simulationConfig.nodes.selectAll('.node')
                         .data(nodes, function (d) {return d.id})
                         .attr("r", 5)
    
    node.exit().remove()

    node = node.enter()
                .append('circle')
                .attr("r", 5)
                .attr("fill", function(d) {return color(d.entry_type)})
                .attr("stroke", "#fff")
                .attr("stroke-width", .5)
                .attr('nodeID', function(d) {return d.id})
                .style('opacity',1)
                .classed('node',true)
                .merge(node)

    node.on('mouseover', function(d,i) { 
            if (i!==0) {
                if(ticksCompleted) {
                    focus(); 
                    d3.select(this).style("cursor", "pointer"); 
                    setPreviewArea(d3.select(d3.event.target).datum())
                }
            }
        })
        .on('mouseout', function(d,i)  { 
            if (i!==0) {
                if(ticksCompleted) {
                    unfocus(); 
                    d3.select(this).style("cursor", "default"); 
                    setPreviewArea(centralNode);
                }
            }
        })
        .on('dblclick', function(d,i) {
            if (i!==0) {
                if (ticksCompleted) {
                    unfocus();
                    let articleTitle = d.title
                    articleMenu.property('value',articleTitle)
                    if (d.entry_type === 'Menu') {
                        updateGraph(data, 'domain', articleTitle, simulationConfig)
                    }   else    { 
                        updateGraph(data, 'article', articleTitle, simulationConfig)
                    }
                }
            }
        })

    //deselect any selected nodes
    window.getSelection().removeAllRanges();

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
                d3.select('.articleGraphGroup').transition().style('opacity',1)

                numTicks++
            }   else {   
            ticksCompleted = true
        }

    })


    //load direction arrays
    // let links_in  = d3.selectAll("[dir=in]");
    //     links_in.nodes().forEach(d => inElements.push(d.__data__.target))

    // let links_out = d3.selectAll("[dir=out]");
    //     links_out.nodes().forEach(d => outElements.push(d.__data__.target))

    // let links_both = d3.selectAll("[dir=both]");
    //     links_both.nodes().forEach(d => biElements.push(d.__data__.target))
    
    // console.log(inElements, outElements, biElements)


    //restart simulation
    simulationConfig.simulation.nodes(nodes);
    simulationConfig.simulation.force("charge").strength(function() { return forceStrength(nodes.length)})
    simulationConfig.simulation.force("link").id(function (d) {return d.id})
                                             .distance(200)
    simulationConfig.simulation.force("link").links(links)
    simulationConfig.simulation.force("forceX").strength(0)
    simulationConfig.simulation.force("forceY").strength(0)
    simulationConfig.simulation.alpha(1).restart();

    //updatePreview
    setPreviewArea(centralNode);

    ticksCompleted = true
    d3.select('.articleGraphGroup').transition().style('opacity',1)


    //******************** Simulation Adjustment functions************************/

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
        if (numberOfNodes > 90) { tickLimit = 300 }

        return tickLimit
    }
    //******************** MOUSE OVER FUNCTIONS FOR INTERACTIVITY ************************/
           // **** The following functions/declarations create the mouseover effects showing node adjacency.
        // **** I found the base code online, but don't remember where. Sorry!
        // **** I updated some of the code for this project.

        let adjacentNodes = [];

        // add source and target adjacentNodes, which is used to activate highlighting
        links.forEach(function (d) {
            adjacentNodes[d.source.index + "-" + d.target.index] = true;
            adjacentNodes[d.target.index + "-" + d.source.index] = true;
        });

        // this function compares two nodes to see if they are neighbors.
        function isNeighbor(a, b) {
            return a == b || adjacentNodes[a + "-" + b];
        }

        // Highlight the current node and the main node, and dim the rest.
        function focus() {
            //get index of current node being mousedOver
            let index = d3.select(d3.event.target).datum().index;

            d3.selectAll('.link').attr("opacity", function (o) {
                return o.source.index == index || o.target.index == index ? 1 : 0.1;
            });
            d3.selectAll('.label').attr("display", function (d) {
                return isNeighbor(index, d.index) ? "block" : "none";
            });
            d3.selectAll('.node').style("opacity", function (o) {
                return isNeighbor(index, o.index) ? 1 : 0.1;
            });

        }

        // Reset graph to default visuals
        function unfocus() {
            d3.selectAll('.link').attr("opacity", 0.3);
            d3.selectAll('.label').attr("display", "block");
            d3.selectAll('.node').style("opacity", 1);
        } 

}

function drawDomainSimulation(data, simulationConfig){

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
    label.exit().remove();

    label = label.enter()
                 .append("text")
                 .text(function(d) {return d.title})
                 .attr("display", "none")
                 .attr("font-size", '10px')
                 .attr("fill", function(d) {return color(d.entry_type)})
                 .attr('nodeID', function(d) {return d.id})
                 .classed('label',true)
                 .classed('mainLabel', function(d,i) {return i===0?true:false})
                 .merge(label)

    label.on('mouseover', function(d,i) { 
            if (i!==0) {
                if (ticksCompleted) {
                    focus(); 
                    d3.select(this).style("cursor", "pointer"); 
                    setPreviewArea(d3.select(d3.event.target).datum())
                }
            }
        })
        .on('mouseout', function(d,i)  { 
            if (i!==0) {
                if(ticksCompleted) {
                    unfocus(); 
                    d3.select(this).style("cursor", "default"); 
                    setPreviewArea(centralNode);
                }
            }
        })
        .on('dblclick', function(d,i) {
            if (i!==0) {
                if (ticksCompleted) {
                    unfocus();
                    let articleTitle = d.title
                    articleMenu.property('value',articleTitle)
                    if (d.entry_type === 'Menu') {
                        updateGraph(data, 'domain', articleTitle, simulationConfig)
                    }   else    { 
                        updateGraph(data, 'article', articleTitle, simulationConfig)
                    }
                    // d3.select('.articleGraphGroup').transition().style('opacity',0.5)
                }
            }

        })

    //nodes
    node = simulationConfig.nodes.selectAll('.node')
                         .data(nodes, function (d) {return d.id})
                         .attr("r", 5)
    
    node.exit().remove()

    node = node.enter()
                .append('circle')
                .attr("r", 5)
                .attr("fill", function(d) {return color(d.entry_type)})
                .attr("stroke", "#fff")
                .attr("stroke-width", .5)
                .attr('nodeID', function(d) {return d.id})
                .style('opacity',1)
                .classed('node',true)
                .merge(node)

    node.on('mouseover', function(d,i) { 
                if(ticksCompleted) {
                    focus(); 
                    d3.select(this).style("cursor", "pointer"); 
                    setPreviewArea(d3.select(d3.event.target).datum())
                }
        })
        .on('mouseout', function(d,i)  { 
                if(ticksCompleted) {
                    unfocus(); 
                    d3.select(this).style("cursor", "default"); 
                    setPreviewArea(centralNode);
                }
        })
        .on('dblclick', function(d,i) {
                if (ticksCompleted) {
                    unfocus();
                    let articleTitle = d.title
                    articleMenu.property('value',articleTitle)
                    if (d.entry_type === 'Menu') {
                        updateGraph(data, 'domain', articleTitle, simulationConfig)
                    }   else    { 
                        updateGraph(data, 'article', articleTitle, simulationConfig)
                    }
                }
        })

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
    
    // console.log(inElements, outElements, biElements)


    //restart simulation
    simulationConfig.simulation.nodes(nodes);
    simulationConfig.simulation.force("charge").strength(function() { return forceStrength(nodes.length)})
    simulationConfig.simulation.force("link").id(function (d) {return d.id}).distance(600)
    simulationConfig.simulation.force("link").links(links)
    simulationConfig.simulation.force("forceX").strength(.5)
    simulationConfig.simulation.force("forceY").strength(.5)
    simulationConfig.simulation.alpha(.1).restart();

    //updatePreview
    setPreviewArea(centralNode);

    ticksCompleted = true
    d3.select('.articleGraphGroup').transition().style('opacity',1)


    //******************** Simulation Adjustment functions************************/

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
    //******************** MOUSE OVER FUNCTIONS FOR INTERACTIVITY ************************/
           // **** The following functions/declarations create the mouseover effects showing node adjacency.
        // **** I found the base code online, but don't remember where. Sorry!
        // **** I updated some of the code for this project.

        let adjacentNodes = [];

        // add source and target adjacentNodes, which is used to activate highlighting
        links.forEach(function (d) {
            adjacentNodes[d.source.index + "-" + d.target.index] = true;
            adjacentNodes[d.target.index + "-" + d.source.index] = true;
        });

        // this function compares two nodes to see if they are neighbors.
        function isNeighbor(a, b) {
            return a == b || adjacentNodes[a + "-" + b];
        }

        // Highlight the current node and the main node, and dim the rest.
        function focus() {
            //get index of current node being mousedOver
            let index = d3.select(d3.event.target).datum().index;

            d3.selectAll('.link').attr("opacity", function (o) {
                return o.source.index == index || o.target.index == index ? 1 : 0.1;
            });
            d3.selectAll('.label').attr("display", function (d) {
                return isNeighbor(index, d.index) ? "block" : "none";
            });
            d3.selectAll('.node').style("opacity", function (o) {
                return isNeighbor(index, o.index) ? 1 : 0.1;
            });

        }

        // Reset graph to default visuals
        function unfocus() {
            d3.selectAll('.link').attr("opacity", 0.3);
            d3.selectAll('.label').attr("display", "none");
            d3.selectAll('.node').style("opacity", 1);
        } 

}

function updateGraph(data, entryType, entryTitle, simulationConfig) {
    let sepData;
    let inSearchCache = articleSearchCache.find( ({search}) => search === entryTitle);
    if (!inSearchCache) {
        sepData = getSEPData(data, entryType, entryTitle);
    }   else    {
        sepData = inSearchCache
    }
    
    setGlobalNodesLinks(sepData)


    if (entryType==='article') {
        drawArticleSimulation(data, simulationConfig)
        domainMenu.property('value','[Search Domains...]')
    }   else{
        drawDomainSimulation(data, simulationConfig)
        articleMenu.property('value', '[Search Articles...]')
    }
}


function getSEPData(data, entryType, entryTitle) {    

    let articleNodes = [];
    let articleLinks = [];
    let articleData = {};

    if (entryType === 'article') {
        data = data.articles
        console.log(data)
        console.log(entryTitle)
        //get the base node to build our graph around    
        let searchNode = data.nodes.filter(node => {
            return node.title === entryTitle
        })
        //get the url for the base node
        let searchID = searchNode[0].id 

        //populate localLinks
        searchNode[0].links.forEach(link => articleLinks.push(link))

        //push the base node into the first position of localNodes
        articleNodes.push(searchNode[0])

        //add all target nodes that are linked from the main node to LocalNodes
        articleLinks.forEach(link => {
            let target = link.target
            data.nodes.filter(node => {
                if (node.id === target) {
                    articleNodes.push(node)
                }
            })
        }) 
        // steps
        // 1. Get SearchNode
        // 2. Add SearchNode to localNodes[0]
        // 2. loops through links array and get all nodes that SearchNode links to
        // 3. 

        let localNodes = []
        let outLinks = []
        let inLinks = []

        let selectedNode = searchNode[0]
        localNodes.push(selectedNode)

        data.links.forEach(link => { 
            if (selectedNode.id === link.source)  {
                let outLink = {'source':selectedNode.id, 'target':link.target}
                outLinks.push(outLink)
            }   else if (selectedNode.id === link.target)  {
                let inLink = {'source':selectedNode.id, 'target':link.source}
                inLinks.push(inLink)
            }
        })


        let bothLink = intersection(outLinks,inLinks)



        let localFinalLinks = Array.from(new Set(outLinks.concat(inLinks)))
        
        localFinalLinks.forEach(link => {
            data.nodes.filter(node => {
                if (node.id===link.target) {
                    localNodes.push(node)
                }
            })

        })
        

    }   else {
        // domain nodes 

        article_nodes = data.articles
        data = data.domains

         //get the base node to build our graph around    
        let searchNode = data.nodes.filter(node => {
            return node.title === entryTitle
        })
        let domainNodes = []
        let sourceLinks = []
        let finalLinks = []

        searchNode[0].data.nodes.forEach(node => domainNodes.push(node))

        domainNodes.forEach(node => {
            article_nodes.links.forEach(link => {
                if (node.id === link.source) {
                    sourceLinks.push(link)
                }
            })
        })

        domainNodes.forEach(node => {
            sourceLinks.forEach(link => {
                if (node.id === link.target) {
                    finalLinks.push(link)
                }
            })
        })

        articleNodes = domainNodes
        articleLinks = finalLinks

    }
    
   
    
    //store the articleData term as an object
    articleData = { "search": entryTitle,
                    "nodes": articleNodes,
                    "links": articleLinks }
    
    articleSearchCache.push(articleData)

    return articleData

    
}

function intersection(a, b) {
    let setA = new Set(a)
    let setB = new Set(b)
    let _intersection = new Set()

    for (let elem of setB) {
        if (setA.has(elem)) {
            console.log('found')
            _intersection.add(elem)
        }
    }
    return _intersection
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

function setPreviewArea(currentNode) {
    
    if(currentNode) {
                
        let title = currentNode.title;
        let sepUrl = baseURL + currentNode.id;
        let entryType = currentNode.entry_type;
        let firstParaText= currentNode.first_paragraph;
        let displayCut = "";
        
        //only display the first 500 characters of the node's intro paragraph

        if(typeof(firstParaText)!=='undefined') {
            if (firstParaText.length > 500 ) {
                firstParaText = firstParaText.substring(0,500);
                lastPeriod = firstParaText.lastIndexOf('.')
                firstParaText = firstParaText.substring(0,lastPeriod+1)
                displayCut = `(Only the first ${firstParaText.length} characters of intro text are displayed.)`;
            }  
        }

 
        
        //select sidebar div from HTML 
        let sidebar = d3.select("#sideBar")    

        //set text of h3 heading
        sidebar.select("h3")
               .text(title)
               .classed('sidebarh3',true)
        
        //select first paragraph from HTML, and set the text to firstParaText
        let firstParagraph = sidebar.select("#intro")
                                    .text(firstParaText)
                                    .classed('firstParagraph',true)
            
        //if displayCut isn't empty, then append a new paragraph to firstParagraph indicating paragraph has been truncated.
        if (displayCut !== "") {
            firstParagraph.append("p")
                            .text(displayCut)
                            .classed('displayCut',true)
        }

        //add link to SEP article
        sidebar.select("#link")
        .html(`Read the full article at SEP:<br><a href="${sepUrl}" target="_blank">${title}</a>`)
        .style('color', 'white')
    }
}

function color(entryType){
    let rgbValue = '';
    if (entryType==='thinker') {
        rgbValue = 'rgb(31, 119, 180)'
    }   else    {
        rgbValue = 'rgb(255, 127, 14)'
        // rgbValue = 'rgb(255,255,0)'
    }
    return rgbValue
}