// #select page search controls
const searchMenu = d3.select("#searchMenu");
const searchTypeOptions = d3.selectAll("input")
const baseURL = 'https://plato.stanford.edu/archives/win2019'

//set default searchType
searchType = 'philosopher'

// set up svg defaults
let searchTerm;

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

let color = d3.scaleOrdinal(d3.schemeCategory10)


let zoom = d3.zoom()
    .scaleExtent([1, 10])
    .on("zoom", zoomed);

function zoomed() {
    const currentTransform = d3.event.transform;
    console.log(currentTransform)
    svg.attr("transform", currentTransform);
    // slider.property("value", currentTransform.k);
}

function slided(d) {
    zoom.scaleTo(svg, d3.select(this).property("value"));
    console.log(d3.select(this).property("value"))
}

// //append zoom slider
// var slider = d3.select("#zoom_slider").html("")

//     slider = d3.select("#zoom_slider")
//     .append("p")
//     .append("input")
//     .datum({})
//     .classed("slider", true)
//     .attr("type", "range")
//     .attr("value", zoom.scaleExtent()[0])
//     .attr("min", zoom.scaleExtent()[0])
//     .attr("max", zoom.scaleExtent()[1])
//     .attr("step", (zoom.scaleExtent()[1] - zoom.scaleExtent()[0]) / 100)
//     .style("display","block")
//     .on("input", slided);
// // append svg

let svg = d3.select("#my_dataviz")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .classed("svgborder",true)
            .append("g")
            .attr("transform",                 
                "translate(" + width/2 + "," + height/2 + ")")
d3.json("network1.json", function (data) {

    loadSearchMenu(data);

    //show full map first
    drawSingleChart_new('Immanuel Kant');


    
    // listen for selections in both menus, and then run drawChart() when a change occurs 
    searchMenu.on("change", updateSearch);
    searchTypeOptions.on("change", function() {
        searchType = this.value;
        loadSearchMenu(data);
    });

    function updateSearch() {
        searchTerm = d3.event.target.value;
        drawSingleChart_new(searchTerm);
    }
});



function loadSearchMenu(data) {

    //initialize search arrays to hold philosophers and concepts
    let allPhilosophers = ["&#10218;Search Philosophers...&#10219;"];
    let allConcepts = ["&#10218;Search Concepts...&#10219;"];

    // searchOptions is the array we will bind to the searchMenu based on user choice
    let searchOptions = [];

    // populate searh arrays 
    data.nodes.forEach(node => {
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

function drawSingleChart_new(searchTerm) {
    d3.json("sep_network.json", function (data) {
        
        if (searchTerm !== 'all') {
            data.nodes = searchSep(data, searchTerm)[0];
            data.links = searchSep(data, searchTerm)[1];
        }
        let container = svg.html("")
             container = svg.append("g")
             .call(zoom)

        console.log(container.node().getBBox())


    
    // Initialize the links
    let linkgroup = container.selectAll("line").data(data.links)
    let link = linkgroup
    .enter()
    .append("line")
    .style("stroke", "#aaa")
    .style("opacity", 0.2);

    link.merge(link);
    link.exit().remove();

// Initialize the nodes

let nodegroup = container.selectAll("circle").data(data.nodes)
let node = nodegroup
    .enter()
    .append("circle")
    .attr("r", function (d) {
        return d.num_links / 4
    })
    .style("fill", function (d) {
        return color(d.entry_type)
    })

    node.merge(node)
    node.exit().remove()

// // Initialize the lables
let label = svg.append("g")
.attr("class", "labels")
.selectAll("text")
.data(data.nodes)
.enter()
.append("text")
.attr("class", "labels")
.text(function (d) {
    return d.title;
});


        // let config = getSVGConfiguration();
        // let {link,node,label} = getNodeConfiguration(config.svg,config.color,data.nodes,data.links);

        node.on("mouseover", focus)
            .on("mouseout", unfocus);

                centerNode = data.nodes[0];

            let node_title = centerNode.title;
            let node_url = baseURL + centerNode.id;
            let node_entrytype = centerNode.entry_type;
            let node_firstp = centerNode.first_paragraph;


            let sidebar = d3.select("#sidebar")    
                sidebar.select("h3").text(node_title)
                sidebar.select("#first")
                        .text(node_firstp)
                        .style("color", "white")
                        .style("font-size", "12px")
                        .style("font-family", "Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif")
                sidebar.select("#link").html(`Read the full article at SEP: <a href="${node_url}" target="_blank">${node_title}</a>`)
    
       
        // Let's list the force we wanna apply on the network
        let simulation =
            d3.forceSimulation(data.nodes) // Force algorithm is applied to data.nodes
            .force("link", d3.forceLink() // This force provides links between nodes
                .id(function (d) {
                    return d.id;
                }) // This provide  the id of a node
                .links(data.links) // and this the list of links
            )
             .force("charge", d3.forceManyBody().strength(-200)) // This adds repulsion between nodes. Play with the -400 for the repulsion strength

             .force("center", d3.forceCenter()) // This force attracts nodes to the center of the svg area
            .on("end", ticked);

        var adjlist = [];

        data.links.forEach(function (d) {
            adjlist[d.source.index + "-" + d.target.index] = true;
            adjlist[d.target.index + "-" + d.source.index] = true;
        });

        // This function is run at each iteration of the force algorithm, updating the nodes position.
        function ticked() {
            link
                .attr("x1", function (d) {return d.source.x;})
                .attr("y1", function (d) {return d.source.y;})
                .attr("x2", function (d) {return d.target.x;})
                .attr("y2", function (d) {return d.target.y;});

            node
                .attr("cx", function (d) {return d.x;})
                .attr("cy", function (d) {return d.y;});

            label
                .attr("x", function (d) {return d.x;})
                .attr("y", function (d) {return d.y;})
                .style("font-size", "6px").style("fill", "#4393c3");

                console.log(data.nodes[0].x, data.nodes[0].y)
        }

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
        }

        function unfocus() {
            label.attr("display", "block");
            node.style("opacity", 1);
            link.style("opacity", .2);

        }

      
    });
}

//searchSep will create subset node/link arrays based on a single search term passed into it
function searchSep(data, searchTerm) {
    
    //init empty arrays
    let filtered_nodes = []
    let filtered_links = []

        //get the base node to build our graph around
        let search_node = data.nodes.filter(node => {
            return node.title === searchTerm
        })

        let search_id = search_node[0].id

        filtered_links = data.links.filter(link => {
            return link.source === search_id
        })

        filtered_nodes.push(search_node[0])

        filtered_links.forEach(link => {
            let target = link.target
            data.nodes.filter(node => {
                if (node.id === target) {
                    filtered_nodes.push(node)
                }
            })

        })

    return [filtered_nodes, filtered_links]
    console.log(filtered_nodes,filtered_links)

}

function getSVGConfiguration() {
    // set basic SVG Config data 
    let margin = {
        top: 40,
        right: 10,
        bottom:40,
        left: 10
    };

    let svgWidth = 600;
    let svgHeight = 600;

    let width = svgWidth - margin.left - margin.right;
    let height = svgHeight - margin.top - margin.bottom;

    let color = d3.scaleOrdinal(d3.schemeCategory10)

    // setup zoom controls and slider

    // setup zoom function

    
    let zoom = d3.zoom()
        .scaleExtent([0, 10])
        .on("zoom", zoomed);

    function zoomed() {
        const currentTransform = d3.event.transform;
        svg.attr("transform", currentTransform);
        slider.property("value", currentTransform.k);
    }

    function slided(d) {
        zoom.scaleTo(svg, d3.select(this).property("value"));
        console.log(d3.select(this).property("value"))
    }

    //append zoom slider
    var slider = d3.select("#zoom_slider").html("")

        slider = d3.select("#zoom_slider")
        .append("p")
        .append("input")
        .datum({})
        .classed("slider", true)
        .attr("type", "range")
        .attr("value", zoom.scaleExtent()[0])
        .attr("min", zoom.scaleExtent()[0])
        .attr("max", zoom.scaleExtent()[1])
        .attr("step", (zoom.scaleExtent()[1] - zoom.scaleExtent()[0]) / 100)
        .style("display","block")
        .on("input", slided);

//append svg area


    let svg = d3.select("#my_dataviz")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
              "translate(" + margin.left + "," + margin.top + ")")

        .call(zoom)
        .call(d3.drag()
            .on("start", function () {
                d3.select(this).raise();
                svg.attr("cursor", "grabbing");
            })
            .on("drag", function (d) {
                d3.select(this).attr("x", d.fx = d3.event.x).attr("y", d.fy = d3.event.y);
            })
            .on("end", function () {
                svg.attr("cursor", "grab");
            }));


        return {margin,svgHeight,svgWidth,width,height,color,svg}
}

function getNodeConfiguration(svg,color,nodes,links) {

let container = svg.append("g")
                    .attr("transform",
                        "translate(" + margin.left + "," + margin.top + ")")

    
    // Initialize the links
    let link = container.selectAll("line")
    .data(links)
    .enter()
    .append("line")
    .style("stroke", "#aaa")
    .style("opacity", 0.2);

// Initialize the nodes
let node = container.selectAll("circle")
    .data(nodes)
    .enter()
    .append("circle")
    .attr("r", function (d) {
        return d.num_links / 4
    })
    .style("fill", function (d) {
        return color(d.entry_type)
    });

// Initialize the lables
let label = container.append("g")
    .attr("class", "labels")
    .selectAll("text")
    .data(nodes)
    .enter()
    .append("text")
    .attr("class", "labels")
    .text(function (d) {
        return d.title;
    });

}
