import Express from "express"


const handle_error_cb = (reject: Function)=>{
    return (reason)=>{
        if(reason.error !== undefined || reason.error !== null)
            console.log(reason);
        reject({
            message: reason.message === undefined ? "something went wrong" : reason.message, 
            status_code: reason.status_code === undefined ? 500 : reason.status_code
        });
    }
}

export {handle_error_cb}