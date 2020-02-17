// #select menu search controls
const menuPhilosophers = d3.select("#select_philosophers");
const menuConcepts = d3.select("#select_concepts");

function loadMenus() {

    d3.json("network1.json", function (data) {

        //initialize search arrays to hold philosophers and concepts
        let allPhilosophers = [];
        let allConcepts = [];

        // populate searh arrays 
        data.nodes.forEach(node => {
            if (node.entry_type === 'thinker') {
                allPhilosophers.push(node.title)
            } else {
                allConcepts.push(node.title)
            }
        })

        menuPhilosophers
            .selectAll("option")
            .data(allPhilosophers)
            .enter()
            .append("option")
            .attr("value", (d) => d)
            .html((d) => d)

        menuConcepts
            .selectAll("option")
            .data(allConcepts)
            .enter()
            .append("option")
            .attr("value", (d) => d)
            .html((d) => d)

        // draw default chart with first item in allPhilosophers array
        // drawChart(allPhilosophers[0]);

    });
};

loadMenus();

// listen for selections in both menus, and then run drawChart() when a change occurs 
menuPhilosophers.on("change", updateSearchOptions);
menuConcepts.on("change", updateSearchOptions)

function updateSearchOptions() {

    searchTerm = d3.event.target.value
    drawChart(searchTerm)
}

function drawChart(searchTerm) {
    d3.json("network1.json", function (data) {
        
        //create arrays containing all data points 
        const allNodes = data.nodes
        const allLinks = data.links

        //searchSep will create subset node/link arrays based on a single search term passed into it
        function searchSep(searchTerm) {
            //init empty arrays
            let filtered_nodes = []
            let filtered_links = []

            //get the base node to build our graph around
            let search_node = allNodes.filter(node => {
                return node.title === searchTerm
            })
            let search_id = search_node[0].id

            filtered_links = allLinks.filter(link => {
                return link.source === search_id
            })

            filtered_nodes.push(search_node[0])

            filtered_links.forEach(link => {
                let target = link.target
                allNodes.filter(node => {
                    if (node.id === target) {
                        filtered_nodes.push(node)
                    }
                })

            })

            return [filtered_nodes, filtered_links]

        }

        data.nodes = searchSep(searchTerm)[0]
        data.links = searchSep(searchTerm)[1]


        let margin = {
            top: 40,
            right: 10,
            bottom: 10,
            left: 10
        };


        let svgWidth = window.innerWidth;
        let svgHeight = window.innerHeight;

        let width = svgWidth - margin.left - margin.right;
        let height = svgHeight - margin.top - margin.bottom;

        let color = d3.scaleOrdinal(d3.schemeCategory10)

        // setup zoom function
        let zoom = d3.zoom()
            .scaleExtent([-1, 10])
            .on("zoom", zoomed);

        function zoomed() {
            const currentTransform = d3.event.transform;
            svg.attr("transform", currentTransform);
            slider.property("value", currentTransform.k);
        }

        function slided(d) {
            zoom.scaleTo(svg, d3.select(this).property("value"));
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
            .on("input", slided);

        //append svg area
         let svg = d3.select("#my_dataviz").html("")

        svg = d3.select("#my_dataviz")
            .style("max-width", svgWidth)
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
                    d3.select(this).attr("x", d.x = d3.event.x).attr("y", d.y = d3.event.y);
                })
                .on("end", function () {
                    svg.attr("cursor", "grab");
                }));

        // Initialize the links
        let link = svg.selectAll("line")
            .data(data.links)
            .enter()
            .append("line")
            .style("stroke", "#aaa")
            .style("opacity", 0.2);

        // Initialize the nodes
        let node = svg.selectAll("circle")
            .data(data.nodes)
            .enter()
            .append("circle")
            .attr("r", function (d) {
                return d.num_links / 4
            })
            .style("fill", function (d) {
                return color(d.entry_type)
            });


        node.on("mouseover", focus)
            .on("mouseout", unfocus);
        // Initialize the lables
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
            .force("center", d3.forceCenter(width / 2, height / 2)) // This force attracts nodes to the center of the svg area
            .on("end", ticked);

        var adjlist = [];

        data.links.forEach(function (d) {
            adjlist[d.source.index + "-" + d.target.index] = true;
            adjlist[d.target.index + "-" + d.source.index] = true;
        });

        // This function is run at each iteration of the force algorithm, updating the nodes position.
        function ticked() {
            link
                .attr("x1", function (d) {
                    return d.source.x;
                })
                .attr("y1", function (d) {
                    return d.source.y;
                })
                .attr("x2", function (d) {
                    return d.target.x;
                })
                .attr("y2", function (d) {
                    return d.target.y;
                });

            node
                .attr("cx", function (d) {
                    return d.x;
                })
                .attr("cy", function (d) {
                    return d.y;
                });

            label
                .attr("x", function (d) {
                    return d.x;
                })
                .attr("y", function (d) {
                    return d.y;
                })
                .style("font-size", "6px").style("fill", "#4393c3");
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