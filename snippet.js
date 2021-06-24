const hyperlinkRegex = /\[(?<text>[^\]]+?)\]\((?<href>https?:\S+?)\)/g;
const text =
  'Get a broad overview - ';

let link;
while ((link = hyperlinkRegex.exec(text))) {
  const [_, x, href] = [...link];
  console.log(x, href);
}
