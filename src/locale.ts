import * as vscode from 'vscode';

const ps = (<any>{
    'ja': '../../../package.nls.ja.json'
})[vscode.env.language] || '';

let loc: any = {}, ori: any = {};

try{ loc = require(ps); } catch(err){ 
    console.log(err);
}
try{ ori = require('../../../package.nls.json'); } catch(err){
    console.log(err);
}


export function locale(name: string, ...args: any[]): string
{
    const msg = loc[name] || ori[name] || name;
    let cnt = 0;
    return msg.replace(/%s/g, () => args[cnt++] || '');
}
