use wasm_bindgen::prelude::*;
use sha1::{Sha1, Digest as Sha1Digest};
use sha2::{Sha256, Digest as Sha2Digest, Sha512};
use md5;
use blake2::{Blake2b512, Blake2s256, Digest as Blake2Digest};
use whirlpool::{Whirlpool, Digest as WhirlpoolDigest};
use tiger::{Tiger, Digest as TigerDigest};

#[wasm_bindgen]
pub fn hasher_results(file: &[u8], algorithms: String) -> String{
    let mut hasher_results = Vec::new();

    for algorithm in algorithms.split(" ") {
        match algorithm.trim() {
            "sha1" => hasher_results.push(sha1_hasher(file)),
            "sha256" => hasher_results.push(sha256(file)),
            "sha512" => hasher_results.push(sha512(file)),
            "md5" => hasher_results.push(md5_hasher(file)),
            "blake2b" => hasher_results.push(blake2b(file)),
            "blake2s" => hasher_results.push(blake2s(file)),
            "whirlpool" => hasher_results.push(whirlpool_hasher(file)),
            "tiger" => hasher_results.push(tiger_hasher(file)),
            /*"argon2" => hasher_results.push(argon2(file)),
            "bcrypt" => hasher_results.push(bcrypt(file)),
            "pbkdf2" => hasher_results.push(pbkdf2(file)),*/
            _ => {}
        }
    }

    return hasher_results.join("\n");
}

pub fn sha1_hasher(file: &[u8]) -> String {
    // Implement SHA-1 hashing logic here
    let mut hasher = sha1::Sha1::new();
    hasher.update(file);
    let result = hasher.finalize();
    format!("sha1 {:x}", result)
}

pub fn sha256(file: &[u8]) -> String {
    // Implement SHA-256 hashing logic here
    let mut hasher = sha2::Sha256::new();
    hasher.update(file);
    let result = hasher.finalize();
    format!("sha256 {:x}", result)
}

pub fn sha512(file: &[u8]) -> String {
    // Implement SHA-512 hashing logic here
    let mut hasher = sha2::Sha512::new();
    hasher.update(file);
    let result = hasher.finalize();
    format!("sha512 {:x}", result)
}

pub fn md5_hasher(file: &[u8]) -> String {
    // Implement MD5 hashing logic here
    let hasher = md5::compute(file);
    format!("md5 {:x}", hasher)
}

pub fn blake2b(file: &[u8]) -> String {
    // Implement BLAKE2b hashing logic here
    let mut hasher = blake2::Blake2b512::new();
    hasher.update(file);
    let result = hasher.finalize();
    format!("blake2b {:x}", result)
}

pub fn blake2s(file: &[u8]) -> String {
    // Implement BLAKE2s hashing logic here
    let mut hasher = blake2::Blake2s256::new();
    hasher.update(file);
    let result = hasher.finalize();
    format!("blake2s {:x}", result)
}

pub fn whirlpool_hasher(file: &[u8]) -> String {
    // Implement Whirlpool hashing logic here
    let mut hasher = whirlpool::Whirlpool::new();
    hasher.update(file);
    let result = hasher.finalize();
    format!("whirlpool {:x}", result)
}

pub fn tiger_hasher(file: &[u8]) -> String {
    // Implement Tiger hashing logic here
    let mut hasher = tiger::Tiger::new();
    hasher.update(file);
    let result = hasher.finalize();
    format!("tiger {:x}", result)
}