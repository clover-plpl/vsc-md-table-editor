import { ExtensionContext, workspace, WorkspaceConfiguration, EventEmitter, Event } from "vscode";


export class MdTableEditorConfig
{
	public static readonly SECTION: string = 'mdtableeditor';
	public static readonly IS_DEBUG_MODE: string = 'isDebugMode';
	public static readonly IS_ICOM_MENU_ENABLED: string = 'isIconMenuEnabled';
	public static readonly IS_AUTO_FORMATTER_ENABLED: string = 'isAutoFormatterEnabled';
	public static readonly IS_TREE_VIEW_ENABLED: string = 'isTreeViewEnabled';
	public static readonly IS_HIGHLIGHTER_ENABLED = 'isHighlighterEnabled';
	public static readonly COMMAND_VIEWS = 'commandViews';

    private configChangedEmitter: EventEmitter<MdTableEditorConfig> = new EventEmitter();
    public readonly configChanged: Event<MdTableEditorConfig> = this.configChangedEmitter.event;

	private _config: WorkspaceConfiguration;

	public get config(): WorkspaceConfiguration
	{
		return this._config;
	}

	public get isHighlighterEnabled(): boolean
	{
		return this.getBool(MdTableEditorConfig.IS_HIGHLIGHTER_ENABLED, true);
	}

	public get isDebugMode(): boolean
	{
		return this.getBool(MdTableEditorConfig.IS_DEBUG_MODE, false);
	}

	public get isIconMenuEnabled(): boolean
	{
		return this.getBool(MdTableEditorConfig.IS_ICOM_MENU_ENABLED, true);
	}

	public get isAutoFormatterEnabled(): boolean
	{
		return this.getBool(MdTableEditorConfig.IS_AUTO_FORMATTER_ENABLED, false);
	}

	public get isTreeViewEnabled(): boolean
	{
		return this.getBool(MdTableEditorConfig.IS_TREE_VIEW_ENABLED, false);
	}

	public get contextCommandViews(): string[]
	{
		return this.getCommandViews()?.['context'];
	}

	public get toolbarCommandViews(): string[]
	{
		return this.getCommandViews()?.['toolbar'];
	}


	public getCommandViews(): { context: string[], toolbar: string[] }
	{
		const obj = this.config.get<any>(MdTableEditorConfig.COMMAND_VIEWS, {});
		const upd = {
			toolbar: obj?.toolbar || [],
			context: obj?.context || []
		};
		
		return upd;
	}

	public async setCommandViews(value: { context: string[], toolbar: string[] }): Promise<void>
	{
		await this.config.update(MdTableEditorConfig.COMMAND_VIEWS, value, true);
	}

	private getBool(name: string, def: boolean): boolean
	{
		const r = this.config.get<boolean>(name);
		return r !== undefined ? r : def;
	}

	public constructor(public readonly context: ExtensionContext)
	{
		this._config = this.getConfig();

		context.subscriptions.push(workspace.onDidChangeConfiguration(e =>
		{
			if(e.affectsConfiguration(MdTableEditorConfig.SECTION))
			{
				this.updateConfig();
			}
		}));
	}

	private updateConfig(): void
	{
        this._config = this.getConfig();
        this.configChangedEmitter.fire(this);
	}

	private getConfig(): WorkspaceConfiguration
	{
		return workspace.getConfiguration(MdTableEditorConfig.SECTION);
	}
}