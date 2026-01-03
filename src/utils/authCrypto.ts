/**
 * SCADA引擎授权加密解密工具
 * 基于 AES-256-CBC + OpenSSL 格式
 * 兼容 Node.js authkey_tool.js
 */

function base64UrlToUint8Array(input: string): Uint8Array {
	const base64 = input.replace(/-/g, '+').replace(/_/g, '/')
	const pad = base64.length % 4 ? '='.repeat(4 - (base64.length % 4)) : ''
	const b64 = base64 + pad
	const raw = (typeof atob !== 'undefined' ? atob : (s: string) => Buffer.from(s, 'base64').toString('binary'))(b64)
	const arr = new Uint8Array(raw.length)
	for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
	return arr
}

function u8ToArrayBuffer(u8: Uint8Array): ArrayBuffer {
	const buf = new ArrayBuffer(u8.byteLength)
	new Uint8Array(buf).set(u8)
	return buf
}

function pemToSpkiArrayBuffer(pem: string): ArrayBuffer {
	const contents = pem
		.replace('-----BEGIN PUBLIC KEY-----', '')
		.replace('-----END PUBLIC KEY-----', '')
		.replace(/\s+/g, '')
	const binary = (typeof atob !== 'undefined' ? atob : (s: string) => Buffer.from(s, 'base64').toString('binary'))(contents)
	const bytes = new Uint8Array(binary.length)
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
	return bytes.buffer
}

async function importPublicKey(publicKeyPem: string): Promise<CryptoKey> {
	const keyData = pemToSpkiArrayBuffer(publicKeyPem)
	return await crypto.subtle.importKey(
		'spki',
		keyData,
		{ name: 'ECDSA', namedCurve: 'P-256' },
		false,
		['verify']
	)
}

export async function validateSignedLicense(token: string, publicKeyPem: string): Promise<boolean> {
	try {
		const [payloadB64, sigB64] = token.split('.')
		if (!payloadB64 || !sigB64) return false
		const key = await importPublicKey(publicKeyPem)
		const dataU8 = base64UrlToUint8Array(payloadB64)
		const sigU8 = base64UrlToUint8Array(sigB64)
		const dataBuf = u8ToArrayBuffer(dataU8)
		const sigBuf = u8ToArrayBuffer(sigU8)
		return await crypto.subtle.verify(
			{ name: 'ECDSA', hash: { name: 'SHA-256' } },
			key,
			sigBuf,
			dataBuf
		)
	} catch {
		return false
	}
}

export async function getSignedAuthInfo(token: string, publicKeyPem: string) {
	const valid = await validateSignedLicense(token, publicKeyPem)
	if (!valid) return null
	const payloadB64 = token.split('.')[0]
	const jsonBytes = base64UrlToUint8Array(payloadB64)
	const jsonStr = new TextDecoder().decode(jsonBytes)
	const obj = JSON.parse(jsonStr)
	const expiryValid = obj.expiryDate
		? new Date().getTime() <= new Date(obj.expiryDate).getTime()
		: true
	return {
		company: obj.company || '未知',
		expiryDate: obj.expiryDate,
		isValid: !!(valid && expiryValid)
	}
}

// 默认导出
export default {
	validateSignedLicense,
	getSignedAuthInfo
}
