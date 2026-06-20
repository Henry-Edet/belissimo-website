export declare enum SignedUrlOperation {
    GET = "GET",
    PUT = "PUT"
}
export declare class GenerateSignedUrlDto {
    key: string;
    operation?: SignedUrlOperation;
    expiresIn?: number;
}
export declare class SignedUrlResponseDto {
    signedUrl: string;
    expiresAt: Date;
    key: string;
    operation: SignedUrlOperation;
}
