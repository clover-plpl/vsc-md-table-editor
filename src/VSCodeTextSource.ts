import { TextDocument } from 'vscode';
import { ITextSource } from '../../MdTableEditor/src/interfaces/ITextSource';

export class VSCodeTextSource implements ITextSource
{
    
    public constructor(private readonly document: TextDocument)
    {
        
    }

    public lineAt(index: number): string
    {
        const range = this.document.lineAt(index).range;
        return this.document.getText(range);
    }

    public hasLine(index: number): boolean
    {
        return index >= 0 && index < this.document.lineCount;
    }
}
