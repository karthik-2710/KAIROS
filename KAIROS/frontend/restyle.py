import os
import re

src_dir = r"c:\Users\karthi\Documents\proji\KAIROS\frontend\src"

# Regular expressions for tailwind colors
# We map standard colors to our semantic CSS variables
color_map = {
    'emerald': 'primary',
    'green': 'primary',
    'blue': 'secondary',
    'indigo': 'secondary',
    'purple': 'secondary',
    'orange': 'accent',
    'yellow': 'accent',
    'amber': 'accent',
    'red': 'danger',
    'rose': 'danger',
}

def replace_styles(content):
    # 1. Drop shadows
    content = re.sub(r'shadow-(sm|md|lg|xl|2xl)', 'shadow-none', content)
    content = re.sub(r'shadow-[a-z]+-500/\d+', '', content)
    
    # 2. Hardcoded Tailwind Colors
    # Backgrounds
    content = re.sub(r'bg-white', 'bg-[var(--color-surface)]', content)
    content = re.sub(r'dark:bg-gray-800', 'dark:bg-[var(--color-surface)]', content)
    content = re.sub(r'dark:bg-gray-900', 'dark:bg-[var(--color-bg)]', content)
    content = re.sub(r'bg-gray-50', 'bg-[var(--color-bg)]', content)
    
    # Borders
    content = re.sub(r'border-gray-200', 'border-[var(--color-border)]', content)
    content = re.sub(r'dark:border-gray-700', 'border-[var(--color-border)]', content)
    content = re.sub(r'border-gray-100', 'border-[var(--color-border)]', content)

    # Specific Badge fixes (like in Recommendation.jsx)
    content = content.replace(
        "'Critical': { color: 'text-red-600', bg: 'bg-red-50', gradient: 'from-red-50 to-rose-50 border-red-200' }",
        "'Critical': { color: 'text-[var(--color-danger)]', bg: 'bg-[var(--color-danger)]/15 border border-[var(--color-danger)]', gradient: '' }"
    )
    content = content.replace(
        "'High':     { color: 'text-orange-600', bg: 'bg-orange-50', gradient: 'from-orange-50 to-orange-100 border-orange-200' }",
        "'High':     { color: 'text-[var(--color-accent)]', bg: 'bg-[var(--color-accent)]/15 border border-[var(--color-accent)]', gradient: '' }"
    )
    content = content.replace(
        "'Moderate': { color: 'text-yellow-600', bg: 'bg-yellow-50', gradient: 'from-yellow-50 to-yellow-100 border-yellow-200' }",
        "'Moderate': { color: 'text-[var(--color-accent)]', bg: 'bg-[var(--color-accent)]/15 border border-[var(--color-accent)]', gradient: '' }"
    )
    content = content.replace(
        "'Low':      { color: 'text-green-600', bg: 'bg-green-50', gradient: 'from-green-50 to-green-100 border-green-200' }",
        "'Low':      { color: 'text-[var(--color-success)]', bg: 'bg-[var(--color-success)]/15 border border-[var(--color-success)]', gradient: '' }"
    )
    content = content.replace(
        "'None':     { color: 'text-emerald-600', bg: 'bg-emerald-50', gradient: 'from-emerald-50 to-green-50 border-emerald-200' }",
        "'None':     { color: 'text-[var(--color-success)]', bg: 'bg-[var(--color-success)]/15 border border-[var(--color-success)]', gradient: '' }"
    )
    
    # Generic generic replacements for text, bg, border
    for old_color, semantic in color_map.items():
        # Text
        content = re.sub(fr'text-{old_color}-\d00', f'text-[var(--color-{semantic})]', content)
        # Bg
        content = re.sub(fr'bg-{old_color}-\d00', f'bg-[var(--color-{semantic})]', content)
        content = re.sub(fr'bg-{old_color}-50(?!0)', f'bg-[var(--color-{semantic})]/15', content)
        # Border
        content = re.sub(fr'border-{old_color}-\d00', f'border-[var(--color-{semantic})]', content)
        content = re.sub(fr'border-{old_color}-50(?!0)', f'border-[var(--color-{semantic})]/30', content)
        content = re.sub(fr'border-{old_color}-100', f'border-[var(--color-{semantic})]/30', content)
        content = re.sub(fr'border-{old_color}-200', f'border-[var(--color-{semantic})]', content)

    # Some remaining gray text
    content = re.sub(r'text-gray-900', 'text-[var(--color-text-primary)]', content)
    content = re.sub(r'text-gray-800', 'text-[var(--color-text-primary)]', content)
    content = re.sub(r'text-gray-700', 'text-[var(--color-text-secondary)]', content)
    content = re.sub(r'text-gray-600', 'text-[var(--color-text-secondary)]', content)
    content = re.sub(r'text-gray-500', 'text-[var(--color-text-muted)]', content)
    content = re.sub(r'text-gray-400', 'text-[var(--color-text-muted)]', content)

    return content

processed = 0
for root, dirs, files in os.walk(src_dir):
    for file in files:
        if file.endswith(('.js', '.jsx', '.tsx', '.ts')):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            new_content = replace_styles(content)
            
            if content != new_content:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Updated {file}")
                processed += 1

print(f"Done processing {processed} files.")
