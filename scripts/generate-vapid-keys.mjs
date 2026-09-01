import {webcrypto} from "node:crypto";

const pair=await webcrypto.subtle.generateKey({name:"ECDSA",namedCurve:"P-256"},true,["sign","verify"]);
const publicJwk=await webcrypto.subtle.exportKey("jwk",pair.publicKey);
const privateJwk=await webcrypto.subtle.exportKey("jwk",pair.privateKey);
const decode=value=>Buffer.from(value.replaceAll("-","+").replaceAll("_","/"),"base64");
const publicKey=Buffer.concat([Buffer.from([4]),decode(publicJwk.x),decode(publicJwk.y)]).toString("base64url");

console.log("VAPID_PUBLIC_KEY="+publicKey);
console.log("VAPID_PRIVATE_KEY="+privateJwk.d);
console.log("\n두 값을 안전한 비밀번호 관리자에 보관하고 Cloudflare secret으로 등록하세요. private key는 저장소 파일에 저장하지 마세요.");
