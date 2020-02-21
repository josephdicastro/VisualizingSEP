
##### Helper Functions to read/write to Mongo #####


def init_collection(db_name, collection_name):
    """ Creates/connects to collection, and then returns it. 

        Keyword Arguments:
        collection_name -- name of new collection, as string

        Returns:
        Newly created MongoDB collection
    """
    print(f"Initializing collection: {collection_name}\n")
    return db_name.collection_name


def test_collection(collection_obj):
    """ Tests collection to check if documents successfully added. 

        Keyword Arguments:
        collection_obj -- name of MongoDB dollection 

        Returns:
        Nothing. Instead: It prints the count of document addition to console.
    """
    collection_name = collection_obj.name
    documents_added = collection_obj.estimated_document_count()

    if documents_added > 0:
        print(
            f"\nScraping Success: {documents_added} documents inserted into {collection_name}.")
    else:
        print(f"\nScraping Failed: 0 documents scraped")
