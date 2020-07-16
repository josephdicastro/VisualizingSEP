from pathlib import Path

def get_local_files(file_path, file_type='*.*'):

    path_to_files = Path.cwd() / file_path
    list_of_local_files = list(Path(path_to_files).rglob(file_type))

    return list_of_local_files