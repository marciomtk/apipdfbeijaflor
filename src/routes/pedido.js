/* eslint-disable semi */
const express = require('express')
const router = express.Router()
const pedido = require('../services/pedido')
const fs = require('fs')

router.post('/gerarpdf', async function (req, res, next) {
  try {
    const filePath = await pedido.gerarPDF(req.body);
    res.download(filePath, (err) => {
      if (err) {
        console.error('Erro ao enviar o PDF: ', err.message);
        next(err)
      } else {
        // Opcional: Remover o arquivo após o download
        fs.unlink(filePath, (err) => {
          if (err) console.error('Erro ao remover o arquivo: ', err.message);
        })
      }
    });
  } catch (err) {
    console.error('Erro ao gerar pdf ', err.message)
    next(err);
  }
});

module.exports = router
