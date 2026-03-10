function response(code,message,data){
    return {code,message,data};
}

const MESSAGE = {
    ADD:"added successfully",
    UPDATE:"updated successfully",
    DELETE:"deleted successfully",
    SERVER_ERROR:"server error",
    INVALID_FORMAT:"invalid data format",
    OTP_SEND:"otp send sucessfully",
    INVALID_OTP:"otp is invalid"
}

export {response,MESSAGE};
