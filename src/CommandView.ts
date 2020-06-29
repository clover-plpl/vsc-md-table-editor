import { QuickPickItem, window, Disposable, commands } from "vscode";
import { MdTableEditorConfig } from "./MdTableEditorConfig";
import { pid } from "process";
import { locale } from "./locale";


interface ITree
{
    [key: string]: string[];
}

class VisibilityTreeFactory
{
    public static readonly tree = {
        "format": ["MdTableEditor.beautifulFormat", "MdTableEditor.naturalFormat", "MdTableEditor.deleteComment", "MdTableEditor.fillCells"],
        "alignments": ["MdTableEditor.changeAlignRight", "MdTableEditor.changeAlignCenter", "MdTableEditor.changeAlignLeft"],
        "insert": ["MdTableEditor.insertTop", "MdTableEditor.insertBottom", "MdTableEditor.insertLeft", "MdTableEditor.insertRight"],
        "remove": ["MdTableEditor.removeColumn", "MdTableEditor.removeRow"],
        "move": ["MdTableEditor.moveTop", "MdTableEditor.moveBottom", "MdTableEditor.moveLeft", "MdTableEditor.moveRight"],
        "focus": ["MdTableEditor.focusLeft", "MdTableEditor.focusTop", "MdTableEditor.focusBottom", "MdTableEditor.focusRight"],
        "selection": ["MdTableEditor.columnSelect", "MdTableEditor.columnSelectAll", "MdTableEditor.columnSelectEmpty"],
        "sort": ["MdTableEditor.sortNumberAsc", "MdTableEditor.sortNumberDesc", "MdTableEditor.sortTextAsc", "MdTableEditor.sortTextDesc", "MdTableEditor.sortTextAsc.ignore", "MdTableEditor.sortTextDesc.ignore"]
    };

    public readonly groups: VisibilityGroupQuickItem[];

    public get allChildren()
    {
        return [].concat(this.groups.map(_ => _.children));
    }

    public get allItems()
    {
        return [].concat(...this.groups.map(_ => [_, ..._.children]));
    }

    public constructor(
        private list: string[],
        private tree: ITree = VisibilityTreeFactory.tree)
    {
        this.groups =  Object.entries(tree).map(([groupName, commandNames]) => {
            const p = new VisibilityGroupQuickItem(groupName, list.includes(groupName));
            const children = commandNames.map(_ => new VisibilityQuickItem(_, list.includes(_)));
            p.children.push(...children);
            return p;
        });
    }
}

export class CommandView extends Disposable
{
    private disp: Disposable[] = [];


    public constructor(private readonly config: MdTableEditorConfig)
    {
        super(() => { Disposable.from(...this.disp).dispose(); } );

        this.contextChange();
        
        this.disp.push
        (

            config.configChanged(async c => {
                await this.contextChange();
            }),

            commands.registerCommand('MdTableEditor.setToolbarCommandVisibility', async () => {
                await this.openDialog('toolbar');
            }),

            commands.registerCommand('MdTableEditor.setContextCommandVisibility', async () => {
                await this.openDialog('context');
            })
        );


    }
    
    private async contextChange()
    {
        const cvs = this.config.getCommandViews();

        for(const target of ['toolbar', 'context'])
        {
            const commandList = cvs[target];
            const groups = new VisibilityTreeFactory(commandList).groups;
            for(const g of groups)
            {
                for(const c of g.children)
                {
                    commands.executeCommand('setContext', `${c.commandName}-${target}`, g.picked || c.picked);
                }
            }            
        }
    }

    private async openDialog(target: 'toolbar' | 'context')
    {
        const quick = window.createQuickPick<VisibilityQuickItem>();
        quick.canSelectMany = true;
        

        const cvs = this.config.getCommandViews();
        const commandList = cvs?.[target] || [];
        const fac = new VisibilityTreeFactory(commandList);
        const treeItems = fac.allItems;
        

        quick.items = treeItems;
        quick.selectedItems = treeItems.filter(_ => commandList.includes(_.commandName));

        quick.onDidChangeSelection(async e => {
            const arr = e.map(_ => _.commandName);
            if(arr.sort().join(',') !== commandList.sort().join(',') || true)
            {
                cvs[target] = arr;
                await this.config.setCommandViews(cvs);
            }
        });
        
        

        quick.onDidAccept(() => quick.hide());
        quick.onDidHide(() => quick.dispose());
        quick.show();

        
    }

    
}


class VisibilityDialog
{
    
}


class VisibilityQuickItem implements QuickPickItem
{
    public picked: boolean;
    public label: string;


    public constructor(public readonly commandName: string, picked: boolean)
    {
        this.label = this.createLabel();
        this.picked = picked;
    }

    protected createLabel()
    {
        return `  ${locale(this.commandName)}`;
    }
}

class VisibilityGroupQuickItem extends VisibilityQuickItem
{
    public readonly children: VisibilityQuickItem[] = [];
    
    public getEnabledChildren()
    {
        return this.picked ? this.children : this.children.filter(_ => _.picked);
    }

    protected createLabel()
    {
        return locale(this.commandName);
    }

}