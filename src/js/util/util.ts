import Express from "express"


const handle_error_cb = (reject: Function, func_name: string)=>{
    return (reason)=>{
        console.log(`${func_name} ERR:\n`+reason.error);
        reject(reason)
    }
}

export {handle_error_cb}