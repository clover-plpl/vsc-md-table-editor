import { window, Position, TextEditor, TextDocument, Range, Selection, TextEditorDecorationType, TextEditorRevealType } from "vscode";
import { MarkdownTableContent } from "../../MdTableEditor/src/impls/MarkdownTableContent";
import { StringCounter } from "../../MdTableEditor/src/StringCounter";

export interface ITableData
{
    table: MarkdownTableContent;
    docIndex: number;
    charIndex: number;
}    



export class MyStopWatch
{
    private tm: number;

    public constructor()
    {
        this.tm = Date.now();
    }

    public step(): number
    {
        const [tm, ntm] = [this.tm, Date.now()];
        this.tm = ntm;
        return ntm - tm;
    }

    public static current: MyStopWatch = new MyStopWatch();

}

export class VscHelper
{
    public static insertCursor(text: string, char: number): string
    {
        let arr = text.split('');
        arr.splice(char, 0, '|');
        return arr.join('');
    }    
    
    public static getCursorPosition(): Position | undefined
    {
        const editor = window.activeTextEditor;

        if(editor)
        {
            const selection = editor.selection;
            
            // TODO: selection.isEmptyである必要は無い仕様にした。
            if(selection)
            {
                return selection.active;
            }
        }
    }

    public static setCursorPosition(...selections: Selection[]): void
    {
        const editor = window.activeTextEditor;
        if(editor)
        {
            const selection = editor.selection;
            if(selection)
            {
                editor.selections = selections;
            }
        }
    }
    



    // TODO: 後で範囲チェック。
    public static replace(start:number, end: number, text: string, cursorPos: Position): boolean
    {
        const editor = window.activeTextEditor;
        if(editor)
        {
            const document = editor.document;
            if(document && !document.isDirty)
            {
                
                const s = document.lineAt(start).range.start;
                const e = document.lineAt(end-1).range.end;
                editor.edit(_ => _.replace(new Range(s, e), text)).then(v => {
                    
                    if(v){ this.setCursorPosition(new Selection(cursorPos, cursorPos)); }
                    else{
                        console.log("error-------------");
                    }
                });
                
                /*
                editor.edit(_ => {
                    const s = document.lineAt(start).range.start;
                    const e = document.lineAt(end-1).range.end;
                    _.replace(new Range(s, e), text);
                    this.setCursorPosition(cursorPos);
                });
                */
                    

                return true;
            }
        }
        return false;
    }

    public static adjustCursorPosition(replace: () => void): void
    {
        const position = this.getCursorPosition();
        const editor = window.activeTextEditor;
        
        if(position && editor)
        {
            replace();
            const currentPosition = this.getCursorPosition();
            if(currentPosition)
            {
                const newLine = Math.min(Math.max(0, editor.document.lineCount - 1), position.line);
                
                const newLineLastChar = editor.document.lineAt(newLine).range.end.character;
                const newChar = Math.min(newLineLastChar, position.character);

                const newPosition = new Position(newLine, newChar);

                editor.selection = new Selection(newPosition, newPosition);
            }
        }
    }


/*
    public static getTableData(): ITableData | undefined
    {
        const ed = window.activeTextEditor;
        const cp = VscHelper.getCursorPosition();

        if(ed && cp)
        {
            const ts = new VSCodeTextSource(ed.document);
            const line = cp.line;
            const table = new MarkdownParser().findContent(ts, line);
            if(table)
            {
                return {
                    table: table,
                    docIndex: cp.line,
                    charIndex: cp.character
                };
            }
        }
    }

*/




    public static scroll(docIndex: number): void
    {
	    const editor = window.activeTextEditor;
	    if(editor)
	    {
		    const range = new Range(new Position(docIndex, 0), new Position(docIndex, 0));
		    editor.revealRange(range, TextEditorRevealType.InCenter);
	    }
    }








    private static dec = window.createTextEditorDecorationType(
        {
            borderWidth: '1px',
            borderStyle: 'dotted solid',
            light:{
                borderColor: 'red'
            },
            dark:{
                borderColor: 'green',
                opacity: '0.5'
            }
        }
    );


    public static selectLine()
    {      
        const editor = window.activeTextEditor;
        
        if(editor)
        {
            
            const selection = editor.selection;
            if(selection && selection.isEmpty)
            {
                const position = selection.active;

                const end = editor.document.lineAt(position.line).range.end.character;

                const zeroPosition = position.with(position.line, 0);
                const lastPosition = position.with(position.line, end);
                const range = new Range(zeroPosition, lastPosition);

                // editor.selection = newSelection;
                editor.setDecorations(VscHelper.dec, [range]);

            }
        }

    }

    public static posChange():void
    {
        const editor = window.activeTextEditor;
        if(editor)
        {
            const selection = editor.selection;
            if(selection && selection.isEmpty)
            {
                const position = selection.active;

                const newPosition = position.with(position.line, 0);
                const newSelection = new Selection(newPosition, newPosition);

                editor.selection = newSelection;

            }
        }
    }



}

export interface IVSCodeTextSourceContext
{
    editor: TextEditor | undefined;
    document: TextDocument;
}




export class FocusDecorator
{


    public static readonly current: FocusDecorator = new FocusDecorator();

    public static defaultBackgroundColor: string = 'rgba(128, 128, 128, 0.2)';

    private static rowDecorator = window.createTextEditorDecorationType(
    {
        borderWidth: '1px',
        //borderStyle: 'solid none',
        borderStyle: 'solid',
        borderColor: 'green',
        backgroundColor: FocusDecorator.defaultBackgroundColor
    });
    
    private static rowLeftDecorator = window.createTextEditorDecorationType(
    {
        borderWidth: '1px',
        borderStyle: 'solid none solid solid',
        borderColor: 'green',
        backgroundColor: FocusDecorator.defaultBackgroundColor
    });

    private static rowRightDecorator = window.createTextEditorDecorationType(
    {
        borderWidth: '1px',
        borderStyle: 'solid solid solid none',
        borderColor: 'green',
        backgroundColor: FocusDecorator.defaultBackgroundColor
    });


    private static columnDecorator = window.createTextEditorDecorationType(
    {
        borderWidth: '1px',
        borderStyle: 'none solid',
        borderColor: 'green',
        backgroundColor: FocusDecorator.defaultBackgroundColor
    });

    private static columnTopDecorator = window.createTextEditorDecorationType(
    {
        borderWidth: '1px',
        borderStyle: 'solid solid none',
        borderColor: 'green',
        backgroundColor: FocusDecorator.defaultBackgroundColor
    });
        
    private static columnBottomDecorator = window.createTextEditorDecorationType(
    {
        borderWidth: '1px',
        borderStyle: 'none solid solid',
        borderColor: 'green',
        backgroundColor: FocusDecorator.defaultBackgroundColor
    });

    
    private static cellDecorator = window.createTextEditorDecorationType(
    {
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'green',
        backgroundColor: FocusDecorator.defaultBackgroundColor
    });
    
        
        
    protected getRowDecorator(): TextEditorDecorationType
    {
        return FocusDecorator.rowDecorator;
    }
    protected getRowLeftDecorator(): TextEditorDecorationType
    {
        return FocusDecorator.rowLeftDecorator;
    }
    protected getRowRightDecorator(): TextEditorDecorationType
    {
        return FocusDecorator.rowRightDecorator;
    }


    protected getColumnDecorator(): TextEditorDecorationType
    {
        return FocusDecorator.columnDecorator;
    }

    protected getColumnTopDecorator(): TextEditorDecorationType
    {
        return FocusDecorator.columnTopDecorator;
    }

    protected getColumnBottomDecorator(): TextEditorDecorationType
    {
        return FocusDecorator.columnBottomDecorator;
    }

    protected getCellDecorator():TextEditorDecorationType
    {
        return FocusDecorator.cellDecorator;
    }

    public getAllTypes(): Array<TextEditorDecorationType>
    {
        return [
            this.getCellDecorator(),
            this.getColumnBottomDecorator(),
            this.getColumnDecorator(),
            this.getColumnTopDecorator(),
            this.getRowDecorator(),
            this.getRowLeftDecorator(),
            this.getRowRightDecorator()
        ];
    }

    public hide(editor: TextEditor): void
    {
        this.getAllTypes().forEach(_ => editor.setDecorations(_, []));
    }


    public decorate(editor: TextEditor, tableData: ITableData): void
    {
        const table = tableData.table;
        const info = table.getCellInfo({docIndex: tableData.docIndex,charIndex: tableData.charIndex });

        const rowRanges: Array<Range> = [];
        const columnRanges: Array<Range> = [];

        if(info)
        {
            
            for(const range of info.row.getCellRanges(str => StringCounter.stringCount(str)))
            {
                if(!info.row.isFirstOrLast(range.cell))
                {
                    if(range.cell === info.cellInfo.cell)
                    {
                        
                    }
                    rowRanges.push(new Range(
                        new Position(tableData.docIndex, range.range.begin),
                        new Position(tableData.docIndex, range.range.end)
                    ));
                }

            }

            for(const [index, row] of [...table.rows].entries())
            {
                const cell = row.getCell(info.columnIndex);
                if(cell)
                {
                    const range = row.getCellRangeFromCell(cell);
                    if(range)
                    {
                        columnRanges.push(new Range(
                            new Position(table.range.begin + index + 2, range.begin),
                            new Position(table.range.begin + index + 2, range.end)
                        ));
                    }
                }
            }

            this.decorateRow(editor, rowRanges);
            this.decorateColumn(editor, columnRanges);

            
            const cell = info.row.getCellRangeFromCharacterIndex(tableData.charIndex);
            if(cell)
            {
                const range = new Range(
                    new Position(tableData.docIndex, cell.range.begin),
                    new Position(tableData.docIndex, cell.range.end)
                );
                this.decorationCell(editor, range);
            }
        }
        
    }

    private decorateRow(editor: TextEditor, rowRanges: Array<Range>): void
    {
        if(rowRanges.length)
        {
            const first = rowRanges[0];
            const last = rowRanges[rowRanges.length - 1];
            const newRange = first.union(last);
            editor.setDecorations(this.getRowDecorator(), [newRange]);
        }
    }

    private decorateColumn(editor: TextEditor, columnRanges: Array<Range>): void
    {
        if(columnRanges.length >= 2)
        {
            editor.setDecorations(this.getColumnTopDecorator(), [columnRanges.shift() as Range]);
            editor.setDecorations(this.getColumnBottomDecorator(), [columnRanges.pop() as Range]);
        }

        if(columnRanges.length)
        {
            editor.setDecorations(this.getColumnDecorator(), columnRanges);
        }
    }

    private decorationCell(editor: TextEditor, range: Range): void
    {
        editor.setDecorations(this.getCellDecorator(), [range]);
    }


}


