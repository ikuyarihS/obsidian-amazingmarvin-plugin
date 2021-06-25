import { icon, library } from '@fortawesome/fontawesome-svg-core';
import { faFlag, faFolder } from '@fortawesome/free-solid-svg-icons';

library.add(faFolder, faFlag);

export const CATEGORY_ICON = icon({ prefix: 'fas', iconName: 'folder' }).node[0];
export const PROJECT_ICON = icon({ prefix: 'fas', iconName: 'flag' }).node[0];
