import { TreeDataProvider, TreeItem, EventEmitter, Event, ProviderResult, Command, ExtensionContext, TreeView, window } from "vscode";
import { MarkdownTableContent } from "../../MdTableEditor/src/impls/MarkdownTableContent";

export class MdTableTreeItem extends TreeItem
{

    public constructor(public readonly tableContent: MarkdownTableContent, index?: number)
    {
        super('');

        this.label = this.getLabel();
        this.command = this.getCommand(index);
    }

    protected getLabel(): string
    {
        const table = this.tableContent;
        const headers = table.headers.cells.map(_ => _.word.trim() || '*').join(' | ');

        return `Table(${table.columnLength}x${table.rowLength}): ${headers}`;
    }
    
    public getCommand(index?: number): Command | undefined
    {
        return {
            title: "実験",
            tooltip: "つーるちっぷ",
            command: "MdTableEditor.scroll",
            arguments: [index]
        };
    }
    
}

export class MdTableTreeDataProvider implements TreeDataProvider<MdTableTreeItem>
{
    private _onDidChangeTreeData: EventEmitter<MdTableTreeItem | undefined> = new EventEmitter<MdTableTreeItem | undefined>();
    public readonly onDidChangeTreeData: Event<MdTableTreeItem | undefined> = this._onDidChangeTreeData.event;

    public constructor(protected tables: MarkdownTableContent[])
    {

    }

    public refresh(tables: MarkdownTableContent[]): void
    {
        this.tables = tables || [];
        this._onDidChangeTreeData.fire(undefined);
    }
    
    public getTreeItem(element: MdTableTreeItem): MdTableTreeItem
    {
        return element;
    }


    public getChildren(element?: MdTableTreeItem | undefined): ProviderResult<MdTableTreeItem[]>
    {
        if(!element)
        {
            return this.tables.map((_, index) => this.createTableItem(_, index));
        }

        return [];
    }

    public createTableItem(table: MarkdownTableContent, index: number): MdTableTreeItem
    {
        return new MdTableTreeItem(table, index);
    }
}


export class MdTableExplorer
{

    public readonly dataProvider: MdTableTreeDataProvider;
    public readonly treeView: TreeView<MdTableTreeItem>;

    public constructor(protected readonly context: ExtensionContext)
    {
        this.dataProvider = new MdTableTreeDataProvider([]);

        context.subscriptions.push(
            this.treeView = window.createTreeView(
                "MdTableEditor.tableExplorer",
                {
                    treeDataProvider: this.dataProvider
                }
            )
        );

    }
    
    public refresh(tables: MarkdownTableContent[])
    {
        this.dataProvider.refresh(tables);
    }


    
}

