// #select page search controls
const searchMenu = d3.select("#searchMenu");
const searchTypeOptions = d3.selectAll("input")
const baseURL = 'https://plato.stanford.edu/archives/win2019'
let graph = {};

//set default searchType
let searchType = 'philosopher'

// set up svg defaults
let searchTerm = "";

// set basic SVG Config data 
   let margin = {
    top: 40,
    right: 10,
    bottom:40,
    left: 10
};

let svgWidth = 750;
let svgHeight = 600;

let width = svgWidth - margin.left - margin.right;
let height = svgHeight - margin.top - margin.bottom;

let color = d3.scaleOrdinal(d3.schemeCategory10);

let svg = d3.select("#my_dataviz")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .classed("svgborder",true);

d3.json("sep_network.json", function (data) {

    graph_data = data;
    graph = data;
    console.log(graph)

    loadSearchMenu(graph_data);

    // listen for selections in both menus, and then run searchSep() when a change occurs 
    searchMenu.on("change", function() {
        searchTerm = d3.event.target.value;
        searchSep(searchTerm)
        restart();
    });
    searchTypeOptions.on("change", function() {
        searchType = this.value;
        loadSearchMenu(graph_data);
    });

    //setup simulation with empty values
        
        let nodes = [];
        let links = [];

        let simulation = d3.forceSimulation(nodes)
            .force("charge", d3.forceManyBody().strength(-200))
            .force("link", d3.forceLink(links).id(function (d) {return d.id}).distance(200))
            .force("center", d3.forceCenter())
            .alphaTarget(1)
            .on("tick", ticked);

        let g = svg.append("g").attr("transform", "translate(" + width / 2  + "," + height / 2 + ")");
        let link = g.append("g").attr("stroke", "#000").attr("stroke-width", 1.5).selectAll("line");
        let node = g.append("g").attr("stroke", "#fff").attr("stroke-width", .75).selectAll(".node")
        let label = g.append("g").attr("display", "block").selectAll(".label");

        // This function is run at each iteration of the force algorithm, updating the nodes position.
        function ticked() {
            link
                .attr("x1", function (d) {return d.source.x;})
                .attr("y1", function (d) {return d.source.y;})
                .attr("x2", function (d) {return d.target.x;})
                .attr("y2", function (d) {return d.target.y;});

            node
                .attr("cx", function (d) {return d.x;})
                .attr("cy", function (d) {return d.y;})

            label

                .attr("x", function (d) {return d.x + 15})
                .attr("y", function (d) {return d.y})
                .style("font-size", "12px").style("fill", "#4393c3");

        }
        restart();


        function restart() {

        node = node.data(nodes)
             .style("fill", function(d) {return color(d.entry_type)})
             .classed("node",true)


        node.exit()
            .remove();
 

        node = node.enter()
                .append("g")
                .classed("node",true)
                .append("circle")
                .call(function(node) { node.transition().attr("r", 10) })
                .style("fill", function(d) {return color(d.entry_type)})
                 .merge(node)


        node.on("mouseover", focus)
            .on("mouseout", unfocus);

        node.on("dblclick",function(d) {
            label.attr("display", "block");
            node.style("opacity", 1);
            link.style("opacity", .2);
            searchTerm = d.title
            searchMenu.property('value',searchTerm)
            searchSep(searchTerm)
            restart();

        })

        // Apply the general update pattern to the links.
        link = link.data(links);

        link.exit().transition()
            .attr("stroke-opacity", 0)
            .attrTween("x1", function(d) { return function() { return d.source.x; }; })
            .attrTween("x2", function(d) { return function() { return d.target.x; }; })
            .attrTween("y1", function(d) { return function() { return d.source.y; }; })
            .attrTween("y2", function(d) { return function() { return d.target.y; }; })
            .remove();

        link = link.enter().append("line")
            .call(function(link) { link.transition().attr("stroke-opacity", 1); })
            .style("stroke", "#aaa")
            .style("opacity", 0.2)
            .merge(link);


    label = label.data(nodes, function(d) {return d.title})
        .classed("label",true)

         label.exit()
              .remove();

        label = label.enter()
                .append("text")
                .classed("label",true)
                .text(function(d) {return d.title})
                .merge(label) 
        
                console.log(label.nodes())
                


        //update sidebar

            updateSidebar(nodes[0]); 

        // Update and restart the simulation.
        simulation.nodes(nodes);
    
        simulation.force("link").links(links);
        simulation.alpha(1).restart();
        console.log(node.nodes())
        
        var adjlist = [];

        links.forEach(function (d) {
            adjlist[d.source.index + "-" + d.target.index] = true;
            adjlist[d.target.index + "-" + d.source.index] = true;
 
        });


        function neigh(a, b) {
            return a == b || adjlist[a + "-" + b];
        }

        function focus(d) {
            var index = d3.select(d3.event.target).datum().index;
            node.style("opacity", function (o) {
                return neigh(index, o.index) ? 1 : 0.1;
            });
            label.attr("display", function (o) {
                return neigh(index, o.index) ? "block" : "none";
            });
            link.style("opacity", function (o) {
                return o.source.index == index || o.target.index == index ? 1 : 0.1;
            });
            updateSidebar(d3.select(d3.event.target).datum())
            console.log(d3.select(d3.event.target).datum().title)
        }

        function unfocus() {
            let currentNode = nodes[0];
            updateSidebar(currentNode);
            label.attr("display", "block");
            node.style("opacity", 1);
            link.style("opacity", .2);

        } 

        function updateSidebar(node) {
            
            if(node) {
                
                

                let node_title = node.title;
                let node_url = baseURL + node.id;
                let node_entrytype = node.entry_type;
                let node_firstp = node.first_paragraph;
                let displayCut = "";

                    if (node_firstp.length > 1500 ) {
                        node_firstp = node_firstp.substring(0,1000);
                        displayCut = "(Only the first 1000 characters of entry are displayed.)";
                    }   

                let sidebar = d3.select("#sidebar")    
                    sidebar.select("h3").text(node_title)
                    firstParagraph = sidebar.select("#first")
                            .text(node_firstp)
                            .style("color", "white")
                            .style("font-size", "12px")
                            .style("font-family", "Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif")
                    if (displayCut !== "") {
                        firstParagraph.append("p")
                                      .text(displayCut)
                                      .style("font-size", "8px")
                                      .style("border-top", ".5px solid white")
                                      .style("padding-top", "5px")
                                      .style("margin-top", "5px")
                    }
                    sidebar.select("#link").html(`Read the full article at SEP: <a href="${node_url}" target="_blank">${node_title}</a>`)
            }
        }
    }


    function loadSearchMenu(graph_data) {

        //initialize search arrays to hold philosophers and concepts
        let allPhilosophers = ["&#10218;Search Philosophers...&#10219;"];
        let allConcepts = ["&#10218;Search Concepts...&#10219;"];

        // searchOptions is the array we will bind to the searchMenu based on user choice
        let searchOptions = [];

        // populate searh arrays 
        graph_data.nodes.forEach(node => {
            if (node.entry_type === 'thinker') {
                allPhilosophers.push(node.title)
            } else {
                allConcepts.push(node.title)
            }
        })

        if (searchType === 'philosopher') {
            searchOptions = allPhilosophers
        }   else {
            searchOptions = allConcepts;
        }

        searchMenu.html("");

        searchMenu.selectAll("option")
                    .data(searchOptions)
                    .enter()
                        .append("option")
                        .attr("value", (d) => d)
                        .html((d) => d)
                    .exit().remove();
    



    }

    //searchSep will create subset node/link arrays based on a single search term passed into it
    function searchSep(searchTerm) {

        // //init empty arrays
         let filtered_nodes =  [];
         let filtered_links =  [];

        //get the base node to build our graph around
        let search_node = graph.nodes.filter(node => {
            return node.title === searchTerm
        })
        
        let search_id = search_node[0].id
        console.log(search_id);

        filtered_links = graph.links.filter(link => {
            return link.source === search_id
        })

        console.log(filtered_links) 

        filtered_nodes.push(search_node[0])

        filtered_links.forEach(link => {
            let target = link.target
            graph.nodes.filter(node => {
                if (node.id === target) {
                    filtered_nodes.push(node)
                }
            })

        })


        console.log(filtered_nodes)
    

        nodes.length = 0
        links.length = 0

        filtered_nodes.forEach(function(node){
            nodes.push(node);

        });
        filtered_links.forEach(function(link) {
            links.push(link)
        })


    }
});