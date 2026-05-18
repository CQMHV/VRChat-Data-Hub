export function jsonOk(data, status = 200) {
    return new Response(JSON.stringify({
        success: true,
        ...data
    }), {
        status,
        headers: {
            'Content-Type': 'application/json;charset=UTF-8'
        }
    });
}

export function jsonError(msg, status = 400) {
    return new Response(JSON.stringify({
        success: false,
        msg
    }), {
        status,
        headers: {
            'Content-Type': 'application/json;charset=UTF-8'
        }
    });
}

export function httpError(message, status = 400) {
    const error = new Error(message);
    error.status = status;
    return error;
}
