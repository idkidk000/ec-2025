// deno-lint-ignore-file no-console
const f32 = new Float32Array(2);
const f16 = new Float16Array(f32.buffer);
const u16 = new Uint16Array(f32.buffer);

const value = 0;
f32[0] = value;
f16[2] = value;

const f32Sign = u16[1] >> 15;
const f32Expo = (u16[1] & 0x7f80) >> 7;
const f32ExpoUnbiased = f32Expo - (1 << (8 - 1)) - 1;
const f32SignificandMsb = ((u16[1] & 0x7f) << 3) | (u16[0] >> 13);
console.log('f32', f32[0]);
console.log('  sign', f32Sign);
console.log('  expo', f32Expo, f32Expo.toString(2).padStart(8, '.'));
console.log('  unbiased', f32ExpoUnbiased, f32ExpoUnbiased.toString(2).padStart(8, '.'));
console.log('  significand', f32SignificandMsb, f32SignificandMsb.toString(2).padStart(10, '.'));

const f16Sign = u16[2] >> 15;
const f16Expo = (u16[2] & 0x7c00) >> 10;
const f16ExpoUnbiased = f16Expo - (1 << (5 - 1)) - 1;
const f16Significand = u16[2] & 0x3ff;
console.log('f16', f16[2]);
console.log('  sign', f16Sign);
console.log('  expo', f16Expo, f16Expo.toString(2).padStart(5, '.'));
console.log('  unbiased', f16ExpoUnbiased, f16ExpoUnbiased.toString(2).padStart(5, '.'));
console.log('  significand', f16Significand, f16Significand.toString(2).padStart(10, '.'));

// this just truncates the exponent and significand instead of rounding the significand minmaxing and -Infinity, Infinity
const calc16Expo = (f32ExpoUnbiased + (1 << (5 - 1)) + 1) & 0x1f;
console.log('f16 calc');
console.log('  sign', f32Sign);
console.log('  expo', calc16Expo, calc16Expo.toString(2).padStart(5, '.'));
console.log('  significand', f32SignificandMsb);
