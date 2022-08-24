pub mod wrap;

pub use wrap::*;

pub fn i8_method(args: ArgsI8Method) -> Result<i8, &'static str> {
    Ok(args.first + args.second)
}

pub fn u8_method(args: ArgsU8Method) -> Result<u8, &'static str> {
    Ok(args.first + args.second)
}

pub fn i16_method(args: ArgsI16Method) -> Result<i16, &'static str> {
    Ok(args.first + args.second)
}

pub fn u16_method(args: ArgsU16Method) -> Result<u16, &'static str> {
    Ok(args.first + args.second)
}

pub fn i32_method(args: ArgsI32Method) -> Result<i32, &'static str> {
    Ok(args.first + args.second)
}

pub fn u32_method(args: ArgsU32Method) -> Result<u32, &'static str> {
    Ok(args.first + args.second)
}
