// select page search controls
const searchMenu = d3.select("#searchMenu");
const searchTypeOptions = d3.selectAll("input[type='radio']");
const buttonAll = d3.select("#showGraph");
const introParagraph = d3.select("#intro");
const link_angles = []

const baseURL = 'https://plato.stanford.edu/archives/spr2020';
const searchCache = [];
const philosophers = ["[Search Philosophers...]"];
const ideas = ["[Search Ideas...]"];
let numTicks = 0;

d3.json('static/sep_network.json', function(data) {

    const deepClone = JSON.parse(JSON.stringify(data))
    
    deepClone.nodes.forEach(d=> {
        if (d.entry_type === 'thinker') {
            philosophers.push(d.title);
        }   else {
            ideas.push(d.title)
        }
    })

    console.log(data.links.length)

    
    // default to loading the philosopher list
    loadSearchMenu('thinker');
    d3.select("#searchType1").property('checked',true)

    function loadSearchMenu(searchType) {

        // searchOptions is the array we bind to the searchMenu based on user choice
        let searchOptions = [];
        
        //switch which array gets loaded into searchOptions
        if (searchType === 'thinker') {
            searchOptions = philosophers;

        }   else {
            searchOptions = ideas;

        }

        //load into searchMenu
        searchMenu.html("");
        searchMenu.selectAll("option")
                    .data(searchOptions)
                    .enter()
                        .append("option")
                        .attr("value", (d) => d)
                        .html((d) => d)
                    .exit().remove();
        
    }

    // listen for selections in both menus, and then run searchSep() when a change occurs 
    searchMenu.on("change", function() {
        searchTerm = d3.event.target.value;
        searchSep(searchTerm);
        introParagraph.style("display", "none")
        d3.select("#dataViz").style("display","block")
        restart();
    });
    searchTypeOptions.on("change", function() {
        loadSearchMenu(this.value);
    });

    buttonAll.on("click", function() {
        console.log("all")
        introParagraph.style("display", "none")
        d3.select("#dataViz").style("display","block")
        searchSep('all')
        restart();
    })
    
    // set basic SVG Config data 
    let margin = {
        top: -100,
        right: 5,
        bottom:15,
        left:5

    };

    let svgWidth = 850;
    let svgHeight = 600;

    let width = svgWidth - margin.left - margin.right;
    let height = svgHeight - margin.top - margin.bottom;

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

    //append svg to div
    let svg = d3.select("#dataViz")
                .append("svg")
                .attr("viewBox", "0 0 " + width + " " + height )
                .attr("preserveAspectRatio", "xMidYMid meet");

    //initialize empty arrays
    let nodes = [];
    let links = [];

    //setup structure of simulation, and bind nodes and links to the simulation. 

    let simulation = d3.forceSimulation(nodes)
                    //    .force("charge", d3.forceManyBody().strength(-100))
                       .force("charge", d3.forceManyBody()
                       .strength(function() {
                           node_count = nodes.length;
                            if (node_count <= 50) {
                               return -1000
                           } else if (node_count >= 50 && node_count <=150) {
                               return -100  
                           } else {
                               return -1000
                           }
                       }))
                       .force("link", d3.forceLink(links).id(function (d) {return d.id}).distance(200))
                       .force("center", d3.forceCenter())
                       .alphaTarget(1)
                       .velocityDecay(.5)
                       .on("tick", ticked)
    
    
                    

    let zoom = d3.zoom()
                 .on("zoom", zoom_actions);

    // create main svg group that will control positioning and zooming of all child elements
    let g1 = svg.append("g")
                .attr("transform", "translate(425,350)")
                .call(zoom)
                .on("dblclick.zoom",null)

    //create secondary svg group so that we can add our graph elements to
    let g = g1.append('g')

    //create main graph elements
    let link = g.append("g")
                .attr("stroke", "#000")
                .attr("stroke-width", 1)
                .selectAll("line");
    let label = g.append("g")
                 .attr("display", "block")
                 .selectAll(".label");
    let node = g.append("g")
                .attr("stroke", "#fff")
                .attr("stroke-width", .5)
                .selectAll(".node")

    //controls how the zoom will occur
    function zoom_actions(){
        let currentTransform = d3.event.transform
        g.attr("transform", currentTransform)
        // slider.property("value",  currentTransform.k);
    }

    const simulationDurationInMs = 3000; // 3 seconds
    let startTime = Date.now();
    let endTime = startTime + simulationDurationInMs;



    function angle(x1, y1, x2, y2) {
        var dy = y2 - y1;
        var dx = x2 - x1;
        var theta = Math.atan2(dy, dx); // range (-PI, PI]
        theta *= 180 / Math.PI; // rads to degs, range (-180, 180]
        // if (theta < 0) theta = 360 + theta; // range [0, 360)
        return theta;
      }

    function rotateLabel(labelI, xPos, yPos){
        rotateVal = link_angles[labelI]
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


     // ticked runs at each iteration of simulation, updating the positions of each node/link/label.
    function ticked() {
        if (nodes.length < 50 ) {
            tickLimit = 100
        }   else {
            tickLimit = 200
        }
        if (numTicks < tickLimit ){
            link.attr("x1", function (d) {return d.source.x;})
                .attr("y1", function (d) {return d.source.y;})
                .attr("x2", function (d) {return d.target.x;})
                .attr("y2", function (d) {return d.target.y;})
                .attr('angle', function(d) {
                    return angle(d.source.x,d.source.y,d.target.x,d.target.y)
                })
                .attr("linkIndex", function(d,i) { j=i+1;link_angles[j] = angle(d.source.x,d.source.y,d.target.x,d.target.y);return i })
                



            label.attr("x", function (d,i) {return i===0 ? d.x-50 : setXpos(d.x,this.getBBox().width)})
                 .attr("y", function (d,i) {return i===0 ? d.y-15 : d.y+4})
                 .style("font-size", function (d,i) {return i===0 ? "12px" : "10px"})
                 .attr("transform", function(d,i){ return i===0 ?`rotate(0)`:rotateLabel(i,d.x, d.y)})
                 .attr("labelIndex", function (d,i){return i})


            node.attr("cx", function (d) {return d.x;})
                .attr("cy", function (d) {return d.y;})
                
                .attr('r', function(d,i) {
                    if (i===0) {
                        return 10
                    } else {
                        if (nodes.length< 60) {
                            return 10
                        }   else{
                            return 5
                        }
                    }
                })
                numTicks++;
        }

                 

            

    }



    //We call this each time the data changes, but here: it starts the empty simulation
    restart();

    // restart() binds binds data to the simulation. This is the main function of the entire script. 
    function restart() {

        console.log(simulation)
        numTicks = 0;
        let t = d3.transition().duration(2000)
    
        // Nodes are the cirlces and main data points of the graph. 
        // Apply the enter-update-exit pattern to bind all the data

        //Bind data to nodes. This governs the update pattern, as the bound data updates any current elements.
        node = node.data(nodes)
        // node = node.data(nodes, function(d) {return d.id})
                //philosopher nodes are colored blue; idea nodes are colored orange
                .style("fill", function(d) {return color(d.entry_type)})
                .classed("node",true)
    
    
        //remove nodes  
        node.exit()
            .transition(t)
            .attr('opacity',0)
            .remove();

        // create new nodes 
        node = node.enter()
                .append("g")
                .classed("node",true)
                .append("circle")
                .style("fill", function(d,i) {
                    return color(d.entry_type)})
                .merge(node)

        // listen for user events 
        node.on("mouseover", focus)
            .on("mouseout", unfocus);

        node.on("dblclick",function(d) {
            //reset display before switching graphs
            unfocus();

            //new node to build a graph from
            let searchItem = d.title

            // update searchMenu and searchTypeOptions based on node entry type
            let entryType = d.entry_type

            if (entryType === 'thinker') {
                //set radio button value
                searchTypeOptions.node().value = 'thinker'
                //switch checked item
                d3.select("#searchType1").property('checked',true)
                //reload searchMenu
                loadSearchMenu('thinker')
            }   else {
                d3.select("#searchType2").property('checked',true)
                searchTypeOptions.node().value = 'idea'
                loadSearchMenu('idea')
            }      
            //set searchMenu to value of selected Node
            searchMenu.property('value',searchItem)
            //build nodes and links 
            searchSep(searchItem)
            //run simulation again 
            restart();
        })

        // Links are the line elements that connect the nodes of the graph. 
        // Apply the enter-update-exit pattern to bind all the data

        //Bind data to links. This governs the update pattern, as the bound data updates any current elements.
        link = link.data(links)
                    .style("stroke", "#aaa")
                    .style("opacity", 0.2)


        //remove links not needed.
        link.exit()
            .remove();

        //create new links
        link = link.enter().append("line")
                .style("stroke", "#aaa")
                .style("opacity", 0.2)
                .merge(link);

        // Labels show the title of each node on the graph.
        // Apply the enter-update-exit pattern to bind all the data

        //Bind data from the nodes (returning only the title of each node) to labels. This governs the update pattern, as the bound data updates any current elements.
        label = label.data(nodes, function(d) {return d.index})
        // label = label.data(nodes, function(d) {return d.id})

                    .style("fill", function(d,i) {return color(d.entry_type)})
                    .classed("mainNode", function(d,i){return i===0?true:false})



                    
        // remove labels that aren't needed.
        label.exit()
            .remove();

        //create labels
        label = label.enter()
                     .append("text")
                     .text(function(d) {return d.title})
                     .style("fill", function(d) {return color(d.entry_type)})
                     .classed("mainNode", function(d,i){return i===0?true:false})
                     .merge(label) 
        
        //update sidebar
        updateSidebar(nodes[0]); 

        simulation.nodes(nodes);
        simulation.force("link").links(links)
        simulation.alpha(1).restart();



 
    
        // **** The following functions/declarations create the mouseover effects showing node adjacency.
        // **** I found the base code online, but don't remember where. Sorry!
        // **** I updated some of the code for this project.

        let adjacentNodes = [];

        // for every link in the links group, add source and target adjacent nodes
        links.forEach(function (d) {
            adjacentNodes[d.source.index + "-" + d.target.index] = true;
            adjacentNodes[d.target.index + "-" + d.source.index] = true;
 
        });

        // this function compares two nodes to see if they are neighbors.
        function isNeighbor(a, b) {
            return a == b || adjacentNodes[a + "-" + b];
        }

        // This function is called when a mouseOver event happens. 
        // It highlights the current node and the main node, and dims the rest.
        function focus(d) {
            //get index of current node being mousedOver
            let index = d3.select(d3.event.target).datum().index;

            node.style("opacity", function (o) {
                return isNeighbor(index, o.index) ? 1 : 0.1;
            });
            label.attr("display", function (o) {
                return isNeighbor(index, o.index) ? "block" : "none";
            });
            link.style("opacity", function (o) {
                return o.source.index == index || o.target.index == index ? 1 : 0.1;
            });

            //update sidebar with preview of mousedOver node's entry paragraph
            updateSidebar(d3.select(d3.event.target).datum())

        }
        // This function is called when a mouseOut event happens. 
        // It's also called then double-clicking on a node to create a new graph
        function unfocus() {
            //reset nodes to full visual strength 
            label.attr("display", "block");
            node.style("opacity", 1);
            link.style("opacity", .2);

            //reset sidebar to main node's text
            updateSidebar(nodes[0]);
        } 

        //This function updates the sidebar to display the selected node's first paragraph of text, 
        // and to show the link into SEP for the full article
        function updateSidebar(node) {
    
            if(node) {
                
                let title = node.title;
                let sepUrl = baseURL + node.id;
                let entryType = node.entry_type;
                let firstParaText= node.first_paragraph;
                let displayCut = "";
                
                //only display the first 1000 characters of the node's intro paragraph
                if (firstParaText.length > 1000 ) {
                    firstParaText = firstParaText.substring(0,1000);
                    lastPeriod = firstParaText.lastIndexOf('.')
                    firstParaText = firstParaText.substring(0,lastPeriod+1)
                    displayCut = `(Only the first ${firstParaText.length} characters of intro text are displayed.)`;
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
    }

    //searchSep searches the entire JSON for the searchTerm, and creates the subset node/link arrays that the graph is based on.
    function searchSep(searchTerm) {

        // //init empty arrays
         let filteredNodes =  [];
         let filteredLinks =  [];

         //clear out all values of the current graph's nodes and links 
        nodes.length = 0
        links.length = 0

        if (searchTerm !== 'all') { 

            // check to see if the current search term is in the search cahse
            let inSearchCache = searchCache.find( ({search}) => search === searchTerm);
            
            if (!inSearchCache) {
                currentSearch = return_nodes_links(searchTerm)
                filteredNodes = currentSearch.nodes;
                filteredLinks = currentSearch.links;

                //push onto searchCache                      
                searchCache.push(currentSearch)
                d3.select("#sideBar").style("display","block")

            }   else {
                // searchTerm WAS in the searchCache, so get the nodes and links from searchCache
                filteredNodes = inSearchCache.nodes;
                filteredLinks = inSearchCache.links;
                d3.select("#sideBar").style("display","block")
            }
            
        }   else { 
            filteredNodes = data.nodes;
            filteredLinks = data.links;
            d3.select("#sideBar").style("display","none")
        }

   

        //add all filteredNodes into links
        filteredNodes.forEach(function(node){
            nodes.push(node);

        });
        //add all filteredlinks into the graph's links
        filteredLinks.forEach(function(link) {
            links.push(link)
        });
    };

    function return_nodes_links(searchTerm) {
       
        let local_nodes = [];
        let unsorted_nodes = [];
        let local_links = [];

        //get the base node to build our graph around    
        let searchNode = data.nodes.filter(node => {
            return node.title === searchTerm
        })

        console.log(searchNode)

        //get the url for the base node
        let searchID = searchNode[0].id 

   
        local_links = searchNode[0].links

      
        //push the base node into the first position of the new filteredNodes subset array
        local_nodes.push(searchNode[0])

        //add all target nodes that are linked from the main node
        local_links.forEach(link => {
            let target = link.target
            data.nodes.filter(node => {
                if (node.id === target) {
                    local_nodes.push(node)
                }
            })

        })

        //store the currentSearch term as an object
        let currentSearch = {   "search": searchTerm,
                                "nodes": local_nodes,
                                "links": local_links }
        return currentSearch

        
    }
    
});

function compareValues(key, order = 'asc') {
    return function innerSort(a, b) {
      if (!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
        return 0;
      }
  
      const varA = (typeof a[key] === 'string')
        ? a[key].toUpperCase() : a[key];
      const varB = (typeof b[key] === 'string')
        ? b[key].toUpperCase() : b[key];
  
      let comparison = 0;
      if (varA > varB) {
        comparison = 1;
      } else if (varA < varB) {
        comparison = -1;
      }
      return (
        (order === 'desc') ? (comparison * -1) : comparison
      );
    };
  }

