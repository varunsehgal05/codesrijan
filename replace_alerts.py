import os
import glob
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if 'alert(' not in content:
        return

    # Add import if not exists
    if 'import { toast }' not in content and 'import toast' not in content:
        # Find the last import statement
        lines = content.split('\n')
        last_import_idx = -1
        for i, line in enumerate(lines):
            if line.startswith('import '):
                last_import_idx = i
        
        if last_import_idx != -1:
            lines.insert(last_import_idx + 1, 'import { toast } from "react-hot-toast";')
        else:
            lines.insert(0, 'import { toast } from "react-hot-toast";')
        content = '\n'.join(lines)

    # Replace alert(...) with toast(...) or toast.error/success based on content
    def repl(match):
        arg = match.group(1)
        if 'err' in arg.lower() or 'fail' in arg.lower() or 'e.response' in arg.lower() or 'error' in arg.lower():
            return f'toast.error({arg})'
        elif 'success' in arg.lower():
            return f'toast.success({arg})'
        else:
            return f'toast({arg})'

    new_content = re.sub(r'alert\((.*?)\)', repl, content, flags=re.DOTALL)

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

def main():
    search_paths = [
        'c:/Users/Varun/Downloads/interactive-showcase-main/interactive-showcase-main/src/**/*.tsx',
        'c:/Users/Varun/Downloads/interactive-showcase-main/interactive-showcase-main/src/**/*.ts'
    ]
    for path in search_paths:
        for filepath in glob.glob(path, recursive=True):
            process_file(filepath)

if __name__ == "__main__":
    main()
