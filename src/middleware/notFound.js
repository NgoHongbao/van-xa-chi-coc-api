export function notFound(req,res){res.status(404).json({success:false,code:'NOT_FOUND',message:`Không tìm thấy API ${req.method} ${req.originalUrl}`});}
