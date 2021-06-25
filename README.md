## Obsidian Sample Plugin

This is a sample plugin for Obsidian (https://obsidian.md).

## Configs
The configs has to be put in a valid JSON formats, the plugin will actually raise errors if it cannot convert (relying on `JSON.parse`)
Example of a valid config:
```json
{
    "title": "Due today",
    "type": "due-today",
    "showNote": true
}
```
All configs:
| Name         | Description                                                                         | Type                   | Default |
|--------------|-------------------------------------------------------------------------------------|------------------------|---------|
| title        | Title of the block.                                                                 | string                 | -       |
| type         | Type of the block.                                                                  | "today" \| "due-today" | -       |
| showNote     | Show notes. Default to true.                                                        | boolean                | false   |
| colorTitle   | Color the name of category, project and tasks. If false, will only color the icons. | boolean                | true    |
| hideEmpty    | Hide empty directory. Default to true.                                              | boolean                | true    |
| inheritColor | Inherit colors from closest parent. Default to true.                                | boolean                | true    |
| showLabel    | Whether to render labels or not. Default to true.                                   | boolean                | true    |

### Examples

![image](https://user-images.githubusercontent.com/19921765/123458209-fbf5ac80-d60e-11eb-81f8-767a2fd2142c.png)

Will render

![image](https://user-images.githubusercontent.com/19921765/123458235-02842400-d60f-11eb-9af0-fd9399456742.png)
