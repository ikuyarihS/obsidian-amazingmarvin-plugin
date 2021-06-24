const hyperlinkRegex = /\[(?<text>[^\]]+?)\]\((?<href>https?:\S+?)\)/g;

const utils = {
  convertHyperlinks: (rawText: string): HTMLSpanElement => {
    const element = document.createElement('span');
    let match;
    let index = 0;
    while ((match = hyperlinkRegex.exec(rawText))) {
      const [_, text, href] = [...match];
      element.appendText(rawText.substring(index, match.index));
      index = match.index;
      element.createEl('a', { text: text, href: href });
    }
    if (index === 0) element.appendText(rawText);
    return element;
  },
};

export default utils;
