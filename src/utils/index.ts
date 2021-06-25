const hyperlinkRegex = /\[(?<text>[^\]]+?)\]\((?<href>https?:\S+?)\)/g;

const utils = {
  convertHyperlinks(rawText: string): HTMLSpanElement {
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

  getNote(note: string | any[]): string {
    let nodes = note;
    if (typeof note === 'string') nodes = JSON.parse(note.substr(note.indexOf('{')))?.document?.nodes;
    return this.getTextFromNodes(nodes);
  },

  getTextFromNodes(nodes: any[]): string {
    const results = nodes
      .map(node => {
        if (node.object === 'leaf' && node.text) return node.text;
        else if (node.leaves || node.nodes) return this.getNote(node.leaves || node.nodes);
      })
      .filter(r => r);
    if (results.length) return results.join('\n');
  },

  toTree(data: any[]): any[] {
    const map: any = data.reduce((obj, item) => ({ ...obj, [item._id]: item }), {});

    const tree: any[] = [];
    data.forEach(item => {
      if (item.parentId in map) {
        map[item.parentId].children = map[item.parentId].children || [];
        map[item.parentId].children.push(item);
      } else {
        tree.push(item);
      }
    });

    return tree;
  },

  hideEmpty(items: any[]): any[] {
    const filtered = items.filter(item => {
      if (item.children) item.children = this.hideEmpty(item.children);
      if (!item.children) delete item.children;
      return !this.isEmpty(item);
    });
    return filtered;
  },

  isEmpty(item: any): boolean {
    if (item.db === 'Tasks') return false;
    if (item.tasks?.length > 0) return false;
    return (item.children || []).every((child: any) => this.isEmpty(child));
  },
};

export default utils;
