# Project Plan

## Functionality

### Article Search

    1. Description 
        - Instead of binding article titles to the search menu, create a generalized search box with type-ahead and intelligent sorting
            - Philosopher/Idea filter may not be needed
            - But node updates should still set the value of the current article in the search box
        - Graph Features
            - Nodes
                - Show all links: incoming and outgoing 
                - Indicate direction with arrows
                - Consider other ways to show density of nodes besides changes in radius
            - Labels
                - Labels on leaf nodes should be smart enough to sort themselves into readable positions
                - Label on main node should be centered horizontally within the graph, and placed slightly above the central node
        - Preview Pane
            - Article Title
            - Author(s)
            - Publication Date
            - Preview Paragraph
            - Appears in ... Taxonomies
    2. Implementation Details 
        - d3.js
            - Update code to v5
            - Compare forceSim to custom layout function
        - Python 
            - refactor current code, making it more Pythonic
            - get additional metadata from InPhO API
                -   This might require an additional MongoDB collection that will collect ALL InPhO data, and parse it what's needed
            - consider restructuring the json
