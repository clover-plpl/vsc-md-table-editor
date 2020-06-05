import { ExtensionContext, Disposable, window, commands, workspace, TextEditor, Position, Range, Selection, TextDocument } from "vscode";
import { VscAppContext } from "./VscAppContext";
import { MdTableExplorer } from "./MdTableTreeView";
import { MdTableEditorConfig } from "./MdTableEditorConfig";
import { AppMain } from "../../MdTableEditor/src/app/AppMain";
import { MarkdownTableContent } from "../../MdTableEditor/src/impls/MarkdownTableContent";
import { IEventReciever } from "../../MdTableEditor/src/interfaces/IEventReciever";
import { IAppContext } from "../../MdTableEditor/src/interfaces/IAppContext";
import { IAppCommandStateUpdatable } from "../../MdTableEditor/src/interfaces/IAppRegister";
import { VscHelper } from "./vsc-helper";
import { ICommand } from "../../MdTableEditor/src/interfaces/ICommand";
import { DefaultCommandFactory } from "../../MdTableEditor/src/app/DefaultCommandFactory";
import { FormatterContext } from "../../MdTableEditor/src/app/FormatterContext";
import { IFormatterMethods } from "../../MdTableEditor/src/interfaces/IFormatterMethods";
import { IFormatterContext } from "../../MdTableEditor/src/interfaces/IFormatterContext";

export class MdTableEditor extends AppMain
{
    public readonly config: MdTableEditorConfig;
    public readonly explorer: MdTableExplorer;


	public constructor(protected readonly context: ExtensionContext)
	{
		super(new VscAppContext());

        // 設定ファイルの変更を監視
        this.config = new MdTableEditorConfig(context);
        
        // 設定ファイルの変更があったらsetContextに反映
        context.subscriptions.push(
            new VscConfigContextUpdater(this.config)
        );

        // テーブルエクスプローラの初期化
        this.explorer = new MdTableExplorer(context);
        
    }
    
    public async initialize(): Promise<void>
    {
        await super.initialize();

        this.config.configChanged(e => this.onConfigChanged());

        // 設定ファイル最初の読み込みイベント
        this.onConfigChanged();

    }

	protected initEvents(eventReciever: IEventReciever): void
	{
		new VscEventRegister(this.context).register(eventReciever);
	}
	
	protected registerCommands(appContext: IAppContext): IAppCommandStateUpdatable
	{
        const cFactory = new DefaultCommandFactory(this.appContext, this.cache);
        return new VscCommandRegister(this.context).register(cFactory);
	}

	protected onTablesUpdated(tables: Array<MarkdownTableContent>): void
	{
        this.explorer.refresh(tables);
	}

	protected onConfigChanged(): void
	{
        // auto formatter
        this.useAutoFormatter = this.config.isDebugMode && this.config.isAutoFormatterEnabled;

        // highlighter
        this.useDecorator = this.config.isHighlighterEnabled;
    }
    

    protected formatted(): void
    {
        const gc = (this.commandExecutionManager as GlobalCommands);

        const cmd = gc?.commandMap?.get('MdTableEditor.beautifulFormat');
        if(cmd)
        {
            gc?.execute(cmd);
        }
    }

    public dispose(): void
    {
        Disposable.from(...this.context.subscriptions).dispose();
    }

}




class VscConfigContextUpdater implements Disposable
{
    public constructor(private readonly config: MdTableEditorConfig)
    {
        this.update();

        this.config.configChanged(e => {
            this.update();
        });
    }
    
    public dispose()
    {
        
    }

    private update(): void
    {
        const config = this.config;
        this.setContext(MdTableEditorConfig.IS_DEBUG_MODE, config.isDebugMode);
        this.setContext(MdTableEditorConfig.IS_ICOM_MENU_ENABLED, config.isIconMenuEnabled);
        this.setContext(MdTableEditorConfig.IS_AUTO_FORMATTER_ENABLED, config.isAutoFormatterEnabled);
        this.setContext(MdTableEditorConfig.IS_TREE_VIEW_ENABLED, config.isTreeViewEnabled);
        this.setContext(MdTableEditorConfig.IS_HIGHLIGHTER_ENABLED, config.isHighlighterEnabled);
    }

    private setContext(name: string, isEnabled: boolean): void
    {
        commands.executeCommand('setContext', `MdTableEditor.${name}`, isEnabled);
    }

}


class VscCommandRegister
{
    public constructor( private readonly context: ExtensionContext)
    {

    }

    public register(factory: DefaultCommandFactory): GlobalCommands // IAppCommandStateUpdatable
    {

        const commandsFactories: Map<string, (p: IFormatterContext) => ICommand> = new Map();
        
		// 状態管理コマンド
		commandsFactories.set('MdTableEditor.beautifulFormat', c => factory.createBeautifulFormat(c));
		commandsFactories.set('MdTableEditor.naturalFormat', c => factory.createNaturalFormat(c));
		commandsFactories.set('MdTableEditor.deleteComment', c => factory.createDeleteComment(c));
		commandsFactories.set('MdTableEditor.fillCells', c => factory.createFillCells(c));
		commandsFactories.set('MdTableEditor.changeAlignRight', c => factory.createChangeAlignRight(c));
		commandsFactories.set('MdTableEditor.changeAlignCenter', c => factory.createChangeAlignCenter(c));
		commandsFactories.set('MdTableEditor.changeAlignLeft', c => factory.createChangeAlignLeft(c));
		commandsFactories.set('MdTableEditor.insertTop', c => factory.createInsertTop(c));
		commandsFactories.set('MdTableEditor.insertBottom', c => factory.createInsertBottom(c));
		commandsFactories.set('MdTableEditor.insertLeft', c => factory.createInsertLeft(c));
		commandsFactories.set('MdTableEditor.insertRight', c => factory.createInsertRight(c));
		commandsFactories.set('MdTableEditor.removeColumn', c => factory.createRemoveColumn(c));
		commandsFactories.set('MdTableEditor.removeRow', c => factory.createRemoveRow(c));
		commandsFactories.set('MdTableEditor.moveTop', c => factory.createMoveTop(c));
		commandsFactories.set('MdTableEditor.moveBottom', c => factory.createMoveBottom(c));
		commandsFactories.set('MdTableEditor.moveLeft', c => factory.createMoveLeft(c));
		commandsFactories.set('MdTableEditor.moveRight', c => factory.createMoveRight(c));
		commandsFactories.set('MdTableEditor.focusLeft', c => factory.createFocusLeft(c));
		commandsFactories.set('MdTableEditor.focusTop', c => factory.createFocusTop(c));
		commandsFactories.set('MdTableEditor.focusBottom', c => factory.createFocusBottom(c));
        commandsFactories.set('MdTableEditor.focusRight', c => factory.createFocusRight(c));
        commandsFactories.set('MdTableEditor.columnSelect', c => factory.createColumnSelect(c));
        commandsFactories.set('MdTableEditor.columnSelectAll', c => factory.createColumnSelectAll(c));
        commandsFactories.set('MdTableEditor.columnSelectEmpty', c => factory.createColumnSelectEmpty(c));
		commandsFactories.set('MdTableEditor.sortNumberAsc', c => factory.createSortAsc(c));
		commandsFactories.set('MdTableEditor.sortNumberDesc', c => factory.createSortDesc(c));
		commandsFactories.set('MdTableEditor.sortTextAsc', c => factory.createTextSortAsc(c));
		commandsFactories.set('MdTableEditor.sortTextDesc', c => factory.createTextSortDesc(c));
		commandsFactories.set('MdTableEditor.sortTextAsc.ignore', c => factory.createTextSortAscIgnore(c));
        commandsFactories.set('MdTableEditor.sortTextDesc.ignore', c => factory.createTextSortDescIgnore(c));
        
        const commands = new Map([...commandsFactories.entries()].map(([commandName, commandFactory]) => {
            
            // 実験目的のため実際では使用しない。
            //const wrapper = this.createWrapperCommand(commandFactory);
            
            const wrapper = this.createCommand(commandFactory);
            return [commandName, wrapper] as [string, ICommand];
        }));

		// 通常コマンド
        commands.set(
            'MdTableEditor.scroll', 
            this.createCommand(c => factory.createIndexScrollCommand(c))
        );
        
		return new GlobalCommands(commands);
    }


    private fmCreater(
        selectCallback: (...selections: Selection[]) => void,
        replaceCallback: (range: Range, txt: string) => void
    )
    {
        return <IFormatterMethods>{
            select: (...selections) => {
                const s = selections.map(_ => {
                    return new Selection(
                        new Position(_.sPos.docIndex, _.sPos.charIndex),
                        _.ePos ? new Position(_.ePos.docIndex, _.ePos.charIndex) : new Position(_.sPos.docIndex, _.sPos.charIndex)
                    );
                });
                selectCallback(...s);
            },
            replace: (range, txt) => 
            {
                const document = window.activeTextEditor?.document;
                if(!document)
                {
                    return;
                }
                const start = range.begin;
                const end = range.end;
                const s = document.lineAt(start).range.start;
                const e = document.lineAt(end-1).range.end;
                replaceCallback(new Range(s, e), txt);
                                
            }
        };
    }

    private internalFormatterContext = new class extends FormatterContext
    {
        private _methods: IFormatterMethods | undefined;

        public setMethods(methods: IFormatterMethods): FormatterContext
        {
            this._methods = methods;
            return this;
        }

        public get methods(): IFormatterMethods
        {
            return this._methods || {
                replace: (range, txt) => {},
                select: (...selections) => {}
            };
        }
    };

    private createCommand(commandFactory: (p: IFormatterContext) => ICommand)
    {
        return commandFactory(this.internalFormatterContext.setMethods(
            this.fmCreater(
                (...selections) => {
                    if(window.activeTextEditor)
                    {
                        window.activeTextEditor.selections = selections;
                    }
                },
                (range, txt) => window.activeTextEditor?.edit(ed => ed.replace(range, txt))
            )
        ));
    }

    // TODO: フォーカスのタイミング実験。
    private createWrapperCommand(commandFactory: (p: IFormatterContext) => ICommand)
    {
        const internalFormatterContext = this.internalFormatterContext;
        let cnt = 0;

        if(true)
        {
            console.log("");
        }

        return <ICommand>{
            canExecute: p => commandFactory(internalFormatterContext).canExecute(p),
            canExecuteChanged: commandFactory(internalFormatterContext).canExecuteChanged,
            execute: p => {

        
                const editor = window.activeTextEditor;
                if(editor)
                {
                    const document = editor.document;
                    if(document && !document.isDirty)
                    {

                        editor.edit(edit => {
                            
                            if(cnt !== 0)
                            {
                                return;
                                throw new Error();
                            }
                            cnt++;
                            const fm = <IFormatterMethods>{
                                select: (...selections) => {
                                    const s = selections.map(_ => {
                                        return new Selection(
                                            new Position(_.sPos.docIndex, _.sPos.charIndex),
                                            _.ePos ? new Position(_.ePos.docIndex, _.ePos.charIndex) : new Position(_.sPos.docIndex, _.sPos.charIndex)
                                        );
                                    });
                                    editor.selections = s;
                                    //VscHelper.setCursorPosition(...s);
                                },
                                replace: (range, txt) => 
                                {
                                    const start = range.begin;
                                    const end = range.end;
                                    const s = document.lineAt(start).range.start;
                                    const e = document.lineAt(end-1).range.end;
                                    edit.replace(new Range(s, e), txt);
                                                    
                                }
                            };
                            if(cnt !== 1)
                            {
                                throw new Error();
                            }

                            try
                            {
                                commandFactory(internalFormatterContext.setMethods(fm)).execute(p);
                            }
                            catch(err)
                            {
                                console.log(err);
                            }

                            
                            if(cnt !== 1)
                            {
                                throw new Error();
                            }

                            cnt--;
                        });
                    }
                }
            }
        };

    }


}



class VscEventRegister
{
    private _activeEditor: TextEditor | undefined;
    
    public constructor(private readonly context: ExtensionContext)
    {

    }

    public register(eventReciever: IEventReciever): void
    {
        const isMarkdown = (document: TextDocument | undefined) =>
        {
            return document?.languageId === 'markdown';
        };
        
        this._activeEditor = window.activeTextEditor;
        if(this._activeEditor)
        {
            if(isMarkdown(this._activeEditor.document))
            {
                eventReciever.otherChanged();
            }
        }

        
        window.onDidChangeActiveTextEditor(e=>
        {
            if(isMarkdown(e?.document))
            {
                this._activeEditor = e;
                eventReciever.otherChanged();
            }
        },
        null, this.context.subscriptions);


        workspace.onDidChangeTextDocument(e=>
        {
            if(isMarkdown(e.document))
            {
                if(this._activeEditor && e.document === this._activeEditor.document )
                {
                    const pos = VscHelper.getCursorPosition();
                    if(pos)
                    {
                        //VscHelper.putInfo(e.document, 'TEXT  ');
                        eventReciever.textChanged({changeStartPosition: {docIndex: pos.line, charIndex: pos.character} });
                    }
                }
            }

        }, null, this.context.subscriptions);

        
        window.onDidChangeTextEditorSelection(e =>
        {
            if(isMarkdown(e.textEditor.document))
            {
                if(this._activeEditor === e.textEditor && e.selections.length)
                {
                    const pos = VscHelper.getCursorPosition();
                    if(pos)
                    {
                        //VscHelper.putInfo(e.textEditor.document, 'SELECT');
                        eventReciever.selectChanged({selectStargePosition: { docIndex: pos.line, charIndex: pos.character} });
                    }
                }
            }
        }, null, this.context.subscriptions);

        
    }

    
}

class GlobalCommands implements Disposable
{

    private disc: Array<Disposable> = [];

    public constructor(public readonly commandMap: Map<string, ICommand>)
    {
        this.initRegister();
    }

    private initRegister(): void
    {
        for(const[name, command] of this.commandMap)
        {
            this.disc.push(commands.registerCommand(name, p => this.execute(command, p)));
            commands.executeCommand('setContext', name, true);
        }
    }

    public updateContents(): void
    {
        for(const [name, command] of this.commandMap.entries())
        {
            const flag = command.canExecute(undefined);
            commands.executeCommand("setContext", name, flag);
        }
    }

    public execute(command: ICommand, parameter?: any): void
    {
        if(command.canExecute(parameter))
        {
            command.execute(parameter);
        }
    }

    public dispose(): void
    {
        Disposable.from(...this.disc).dispose();
    }
}

