export default defineEventHandler(async () => {
  throw createError({
    statusCode: 501,
    statusMessage: 'Not Implemented',
    message:
      'GET /api/v1/portfolio/risk (cluster correlation matrix, breach list, user holdings analysis) is not in API v1.4. Wire when backend ships portfolio risk endpoint.',
  })
})
