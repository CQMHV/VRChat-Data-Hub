export class AwsClient {
    constructor(options) {
        this.accessKeyId = options.accessKeyId;
        this.secretAccessKey = options.secretAccessKey;
        this.region = 'auto';
    }

    async sign(method, url, headers = {}) {
        const urlObj = new URL(url);
        headers.host = urlObj.host;

        const now = new Date();
        const datetime = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
        const date = datetime.slice(0, 8);
        const scope = `${date}/${this.region}/s3/aws4_request`;

        urlObj.searchParams.set('X-Amz-Algorithm', 'AWS4-HMAC-SHA256');
        urlObj.searchParams.set('X-Amz-Credential', `${this.accessKeyId}/${scope}`);
        urlObj.searchParams.set('X-Amz-Date', datetime);
        urlObj.searchParams.set('X-Amz-Expires', '3600');

        const sortedHeaderKeys = Object.keys(headers).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
        const canonicalHeaders = sortedHeaderKeys.map((key) => `${key.toLowerCase()}:${headers[key].trim()}\n`).join('');
        const signedHeaders = sortedHeaderKeys.map((key) => key.toLowerCase()).join(';');

        urlObj.searchParams.set('X-Amz-SignedHeaders', signedHeaders);
        urlObj.searchParams.sort();

        const payloadHash = 'UNSIGNED-PAYLOAD';
        const canonicalRequest = `${method}\n${urlObj.pathname}\n${urlObj.searchParams.toString()}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
        const stringToSign = `AWS4-HMAC-SHA256\n${datetime}\n${scope}\n${await this.sha256(canonicalRequest)}`;
        const signatureKey = await this.getSignatureKey(date);
        const signature = await this.hmac(signatureKey, stringToSign, 'hex');
        urlObj.searchParams.set('X-Amz-Signature', signature);

        return urlObj.toString();
    }

    async getSignatureKey(date) {
        const kDate = await this.hmac(new TextEncoder().encode(`AWS4${this.secretAccessKey}`), date);
        const kRegion = await this.hmac(kDate, this.region);
        const kService = await this.hmac(kRegion, 's3');
        return this.hmac(kService, 'aws4_request');
    }

    async hmac(key, string, encoding) {
        const cryptoKey = await crypto.subtle.importKey('raw', key, {name: 'HMAC', hash: 'SHA-256'}, false, ['sign']);
        const signature = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(string));
        if (encoding === 'hex') {
            return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
        }
        return signature;
    }

    async sha256(string) {
        const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(string));
        return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
    }
}
