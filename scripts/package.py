from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parent.parent
version = __import__('json').loads((root / 'package.json').read_text())['version']
archive = root.parent / f'game-ui-cards-v{version}.zip'
with ZipFile(archive, 'w', ZIP_DEFLATED) as output:
    for name in ('_worker.js', 'index.html'):
        output.write(root / 'upload' / name, name)
    # 授权与致谢随包附上（_worker.js 只响应 /mcp 和 /health，这些文件不会被当成网页公开）。
    output.write(root / 'LICENSE', 'LICENSE.txt')
    output.write(root / 'CREDITS.md', 'CREDITS.md')
    for font in sorted((root / 'fonts').glob('*.txt')):
        output.write(font, 'fonts/' + font.name)
    output.writestr('说明.txt', '游戏卡片 Game UI Cards v' + version + '\n'
        '一个让 ChatGPT / Claude 在聊天里显示游戏卡片的显示层，不含游戏引擎、剧情或规则。\n'
        '使用和部署说明：https://github.com/key116/game-ui-cards\n'
        '授权：PolyForm Noncommercial 1.0.0（仅限非商业使用），见 LICENSE.txt；字体与致谢见 CREDITS.md 和 fonts/。\n')
print(f'Wrote {archive}')
