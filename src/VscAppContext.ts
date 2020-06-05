import { window, Position, TextEditor } from 'vscode';
import { VscHelper, FocusDecorator } from './vsc-helper';
import { IAppConfig, IAppContext } from '../../MdTableEditor/src/interfaces/IAppContext';
import { IDocumentPosition } from '../../MdTableEditor/src/interfaces/IDocumentPosition';
import { MarkdownRange } from '../../MdTableEditor/src/interfaces/MarkdownRange';
import { IStringCounter } from '../../MdTableEditor/src/interfaces/IStringCounter';
import { ITextSource } from '../../MdTableEditor/src/interfaces/ITextSource';
import { VSCodeTextSource } from './VSCodeTextSource';
import { MarkdownTableContent } from '../../MdTableEditor/src/impls/MarkdownTableContent';

class AppConfig implements IAppConfig
{
	// TODO: まだ仕様を決めてない。
	public returnKey(): string
	{
		const editor = window.activeTextEditor;
		if(editor)
		{
			return editor.document.eol === 1 ? "\n" : "\r\n";
		}

		return "\n";
	}
	
}


export class VscAppContext implements IAppContext
{
	private readonly decorator = new DecorationApi();

	public constructor()
	{

	}
	
	
	public getCursor(): IDocumentPosition | undefined
	{
		const pos = VscHelper.getCursorPosition();
		if(pos)
		{
			return {
				docIndex: pos.line,
				charIndex: pos.character
			};
		}
	}

	public replace(range: MarkdownRange, text: string, cursorPos: IDocumentPosition): void
	{
		VscHelper.replace(range.begin, range.end, text, new Position(cursorPos.docIndex, cursorPos.charIndex));
	}

	public getStringCounter(): IStringCounter
	{
		return this.stringCounter;
	}

	// http://blog.tofu-kun.org/070627210315.php
	public stringCounter(str: string): number
	{	
		let len = 0;
		let strSrc = escape(str);
		for(let i = 0; i < strSrc.length; i++, len++){
			if(strSrc.charAt(i) === "%"){
				if(strSrc.charAt(++i) === "u"){
					i += 3;
					len++;
				}
				i++;
			}
		}
		return len;
	}


	public getTextSource(): ITextSource | undefined
	{
		const ed = window.activeTextEditor;
		if(ed)
		{
			return new VSCodeTextSource(ed.document);
		}
	}

	public getAppConfig(): IAppConfig
	{
		return new AppConfig();
	}

	public decorate(table: MarkdownTableContent, docPos: IDocumentPosition): void
	{
		this.decorator.decorate(table, docPos);
	}

	public clearDecorate(): void
	{
		this.decorator.clearDecorate();
	}
	

	public scroll(docIndex: number): void
	{
		VscHelper.scroll(docIndex);
	}
}



class DecorationApi
{
	private currentEditor: TextEditor | undefined;
	private decorator: FocusDecorator = new FocusDecorator();

	public constructor()
	{

	}

	public decorate(table: MarkdownTableContent, docPos: IDocumentPosition): void
	{
		this.clearDecorate();

		this.currentEditor = window.activeTextEditor;
		if(this.currentEditor)
		{
			this.decorator.decorate(
				this.currentEditor,
				{
					table: table,
					docIndex: docPos.docIndex,
					charIndex: docPos.charIndex
				}
			);
		}
	}

	public clearDecorate(): void
	{
		if(this.currentEditor)
		{
			this.decorator.hide(this.currentEditor);
			this.currentEditor = undefined;
		}
	}
	


}

