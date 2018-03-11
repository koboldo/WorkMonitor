import { User } from '../_models/index';

export const PREFIX:string = "__"
/*
 {
     "index": 1,
     "reason": "any|changeComplexity|cancel|reasign"
     "date": "2016-09-02 17:32",
     "createdBy": 1,
     "sCreatedBy": "Depp",
     "text": "To jest komentarz",
 }
 */


export class Comment {

    index: number;
    reason: string;
    date: string;
    createdBy: number;
    sCreatedBy: string;
    text: string;

}

export class Comments {

    public comments: Comment[] = [];

    constructor(dbContent:string) {
        //console.log("dbContent comment: " + dbContent);
        if (dbContent && dbContent.length > 3 && dbContent.startsWith(PREFIX)) {
            console.log("got new "+dbContent);
            this.comments = JSON.parse(decodeURIComponent(atob(dbContent.substring(2))));
        } else if (dbContent && dbContent.length > 1) {
            console.log("got old "+dbContent);
            let comment: Comment = <Comment> {index: 1, reason: "stary", date: "?", createdBy: -1, sCreatedBy: "?", text: dbContent};
            this.comments.push(comment);
        } else {
            console.log("No comment!");
        }
    }

}

//its a shame it cannot be object funtions as the contructor does not create object instance with them!

export function commentToDbContent(comments: Comments) {
    console.log("returning comment db representation: "+JSON.stringify(comments.comments));
    try {
        return PREFIX+btoa(encodeURIComponent(JSON.stringify(comments.comments)));
    } catch(e) {
        console.log("Cannot base64: "+encodeURIComponent(JSON.stringify(comments.comments)));
        throw e;
    }

}

export function commentAdd(comments: Comments, reason: string, createdBy: User, content: string): void {
    let index: number = comments.comments.length;
    let now = new Date();
    let sNow = now.toISOString().substr(0, 16).replace('T', ' ');
    let comment: Comment = <Comment> {index: 1, reason: reason, date: sNow, createdBy: createdBy.id, sCreatedBy: createdBy.firstName+' '+createdBy.lastName, text: content};
    comments.comments.push(comment);
}

//formatted version for html
export function commentAsString(comments: Comments): string {
    let result: string = "";
    for(let comment of comments.comments) {
        result += comment.date+", "+comment.reason+", "+comment.sCreatedBy+", \""+comment.text+"\"\n";
    }
    return result;
}

//formatted simple version for html
export function commentAsSimpleString(comments: Comments): string {
    let result: string = "";
    for(let comment of comments.comments) {
        result += "\""+comment.text+"\" -> ";
    }
    return result;
}

//
export function commentCancelOrHoldAsString(comments: Comments): string {

    for(let comment of comments.comments) {
        if (comment.reason === 'Anulowanie') {
            return comment.sCreatedBy + ": \"" + comment.text + "\"";
        }
    }
    return comments.comments[comments.comments.length-1].text;

}