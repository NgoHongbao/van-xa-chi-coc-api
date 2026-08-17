export function errorHandler(error,req,res,next){
  const status=Number(error.status)||500;
  if(status>=500) console.error(error);
  res.status(status).json({success:false,code:error.code||'INTERNAL_ERROR',message:error.message||'Có lỗi máy chủ xảy ra.',...(error.details!==undefined?{details:error.details}:{})});
}
