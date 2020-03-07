Viz steps:







—get main node

—get all outgoing links by searching links array where the id of the main node is the id of the source

—1. get all incoming links by searching the links array where the id of the main node is the id of the target property 

  2. Take the difference of outgoing links from the incoming links, and that set is the incoming links that should be in the incoming links nodes in the graph 

 

To build the graph:

set main mode bubble in the middle of the graph
get all of the incoming links, group them together as an svg group,raise them above the main node,  bend them in a semi-circle circle, and then fan them out along the circle. For each sub node, find its center point, and then draw a line to the center point of the main node.
Do the same thing for the outgoing links, but make them below. 
Label each node link with a direction arrow. For those links that are both incoming and outgoing, add a second line, or at least  draw two separate direction arrows 
AutoFit contents to size of screen / area
A straight line shots out from the main node to the right, which creates a sidebar area with additional data on the main node 

update graph:

when a user double clicks on a satellite node:

The satellite node is highlighted, then slides down its link to the main mode
The other nodes fade away 
the main node updates with the new title 
New modes burst out along their individual link axes, along the positioning scheme identified above . The incoming links start left and can up; the outgoing links start right and can down 
The sidebar node does something to indicate updates. 