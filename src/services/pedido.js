/* eslint-disable no-trailing-spaces */
/* eslint-disable quotes */
/* eslint-disable semi */
const PDFDocument = require("pdfkit");
const fs = require("fs");
const axios = require("axios");

// Função para adicionar o rodapé
function titleCase(str) {
  return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

async function getImageAsBase64(url) {
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    const imageType = url.split(".").pop().toLowerCase(); // Extrai a extensão da imagem
    return `data:image/${imageType};base64,${Buffer.from(
      response.data
    ).toString("base64")}`;
  } catch (error) {
    console.error("Erro ao carregar imagem:", error);
    throw error;
  }
}

async function gerarPDF(dadosPedido) {
  return new Promise(async (resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 20 });
    const filePath = `${dadosPedido.cabecalho.tituloPedido}.pdf`;
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    // Cabeçalho com fundo azul
    doc.rect(0, 0, doc.page.width, 80).fill("#002f87");
    doc
      .fillColor("white")
      .fontSize(25)
      .text(`${dadosPedido.cabecalho.fantasia}`, 10, 25, {
        width: 400,
        ellipsis: true,
      });
    // Ajustando a cidade para Title Case
    const cidadeFormatada = titleCase(dadosPedido.cabecalho.cidadeEmpresa);
    // Informações da empresa à direita
    doc
      .fillColor("white")
      .fontSize(12)
      .text(
        `${cidadeFormatada}\n${dadosPedido.cabecalho.numero}, ${dadosPedido.cabecalho.bairro}
          ${dadosPedido.cabecalho.endereco} ${dadosPedido.cabecalho.estado} - ${dadosPedido.cabecalho.telefone}`,
        doc.page.width - 200,
        15,
        { align: "right" }
      );

    try {
      const base64Image = await getImageAsBase64(
        `${dadosPedido.cabecalho.logo}`
      );
      doc.image(base64Image, doc.page.width - 100, 118, { fit: [80, 80] });
    } catch (error) {
      console.error("Erro ao carregar imagem:", error);
    }

    doc.rect(0, 80, doc.page.width, 30).fill("#dbe4ff");
    doc
      .font("Helvetica-Bold")
      .fillColor("black")
      .fontSize(14)
      .text(`Vendedor: `, 10, 90);
    doc
      .font("Helvetica")
      .text(` ${dadosPedido.cabecalho.nomeVendedor}`, 78, 90);
    doc
      .fillColor("black")
      .font("Helvetica")
      .fontSize(14)
      .text(` ${dadosPedido.cabecalho.dataPedido}`, doc.page.width - 250, 90, {
        align: "right",
      });

    doc.moveDown(2);

    const cidadeClienFormatada = titleCase(dadosPedido.cabecalho.cidadeCliente);
    // Informações do pedido
    doc
      .font("Helvetica-Bold")
      .fillColor("black")
      .fontSize(16)
      .text(`${dadosPedido.cabecalho.nomeCliente}`, 10, 118, { align: "left" });
    // doc.font('Helvetica-Bold').fillColor('black').fontSize(14).text(`Cliente: ${dadosPedido.cabecalho.nomeCliente}`, 110, 140);
    doc
      .font("Helvetica")
      .fontSize(14)
      .text(`Cnpj/cpf: ${dadosPedido.cabecalho.cpfCnpj}`, 10);
    doc
      .font("Helvetica")
      .text(`Telefone: ${dadosPedido.cabecalho.telefoneCliente}`);
    doc.font("Helvetica").text(`Cidade: ${cidadeClienFormatada}`);
    doc
      .font("Helvetica")
      .text(`Status do pedido: ${dadosPedido.cabecalho.statusPedido}`);

    // Adicionando uma linha horizontal
    doc
      .strokeColor("#d6d6d6") // Define a cor da linha
      .lineWidth(0.5) // Define a espessura da linha
      .moveTo(10, 205) // Ponto inicial (x, y)
      .lineTo(585, 205) // Ponto final (x, y) - mantenha o mesmo valor de y
      .stroke(); // Desenha a linha

    doc.moveDown();

    doc
      .font("Helvetica")
      .text(`Nº. Pedido: ${dadosPedido.cabecalho.idPedido}`, 0, 215, {
        align: "center",
      });
    doc.rect(5, 245, doc.page.width - 10, 30).fill("#ededed");

    doc
      .font("Helvetica-Bold")
      .fontSize(13)
      .fillColor("#525252")
      .text(`Cod.`, 10, 255);
    doc.text(`Descrição`, 75, 255);
    doc.text(`Quant.`, 210, 255);
    doc.text(`Valor`, 275, 255);
    doc.text(`Uni.`, 360, 255);
    doc.text(`Desc. Uni.`, 399, 255);
    doc.text(`Total`, 505, 255);

    let startY = 278; // Posição Y inicial para a tabela

    // Linhas da tabela
    dadosPedido.itens.forEach((item, index) => {
      // Verifica se a posição Y está próxima do final da página
      if (startY > doc.page.height - 70) {
        // Se estiver a 100 pixels do final
        doc.addPage(); // Adiciona uma nova página
        startY = 40; // Reinicia a posição Y
      }
      // Configuração da descrição do produto
      const produtoText = `${item.produto}`;
      const textOptions = { width: 400, align: "left" }; // Aumentando a largura para quase toda a linha
      const textHeight = doc.heightOfString(produtoText, textOptions); // Altura do texto

      // Código do produto
      doc
        .font("Helvetica")
        .fillColor("black")
        .fontSize(13)
        .text(`${item.codigo}`, 10, startY);

      // Descrição do produto ocupa quase toda a linha
      doc
        .font("Helvetica")
        .fontSize(13)
        .text(produtoText, 75, startY, textOptions);

      // Ajustando a posição correta das demais colunas
      const adjustedY = startY + textHeight + 5; // Considera a altura da descrição do produto

      // Reposicionando as outras colunas para dar mais espaço à descrição
      doc
        .font("Helvetica")
        .fillColor("#525252")
        .fontSize(13)
        .text(`${item.quantidade}`, 210, adjustedY);
      doc.text(`${item.valorUni}`, 275, adjustedY);
      doc.text(`${item.unidade}`, 360, adjustedY);
      doc.text(`${item.desconto}`, 399, adjustedY);
      doc
        .fillColor("black")
        .fontSize(13)
        .text(`${item.total}`, 505, adjustedY, { width: 210 });

      // Se **não** for o último item, desenha a linha separadora
      if (index < dadosPedido.itens.length - 1) {
        doc
          .strokeColor("#d6d6d6")
          .lineWidth(0.5)
          .moveTo(10, adjustedY + 15)
          .lineTo(750, adjustedY + 15) // Linha mais longa para acompanhar o novo layout
          .stroke();
      }

      // Atualizando a posição para o próximo item
      startY = adjustedY + 25;
    });

    doc.moveDown();
    doc.rect(5, startY - 5, doc.page.width - 10, 90).fill("#dbe4ff");

    // Informações da empresa à direita
    doc
      .fillColor("black")
      .fontSize(14)
      .text(`${dadosPedido.cabecalho.observacao}`, 10, startY + 5, {
        width: 230,
        align: "left",
      });

    // Informações da empresa à direita
    doc
      .fillColor("black")
      .fontSize(14)
      .text(`Subtotal`, doc.page.width - 300, startY + 5, { align: "left" });

    doc
      .fillColor("black")
      .fontSize(14)
      .text(
        `${dadosPedido.cabecalho.subTotal}`,
        doc.page.width - 300,
        startY + 5,
        { align: "right" }
      );

    doc
      .fillColor("black")
      .fontSize(14)
      .text(`Desc. Total dos Itens`, doc.page.width - 300, startY + 25, {
        align: "left",
      });

    doc
      .fillColor("black")
      .fontSize(14)
      .text(
        `${dadosPedido.cabecalho.descontoItens}`,
        doc.page.width - 300,
        startY + 25,
        { align: "right" }
      );

    doc
      .fillColor("black")
      .fontSize(14)
      .text(`Desc. Venda`, doc.page.width - 300, startY + 45, {
        align: "left",
      });

    doc
      .fillColor("black")
      .fontSize(14)
      .text(
        `${dadosPedido.cabecalho.descontoPedido}`,
        doc.page.width - 300,
        startY + 45,
        { align: "right" }
      );

    doc
      .font("Helvetica-Bold")
      .fillColor("black")
      .fontSize(15)
      .text(`Total`, doc.page.width - 300, startY + 65, { align: "left" });

    doc
      .fillColor("black")
      .fontSize(15)
      .text(
        `${dadosPedido.cabecalho.total}`,
        doc.page.width - 300,
        startY + 65,
        { align: "right" }
      );

    startY = startY + 130; // Posição Y inicial para a tabela

    doc
      .font("Helvetica-Bold")
      .fillColor("black")
      .fontSize(15)
      .text(`Meio de pagamento`, 10, startY - 18, { align: "left" });
    // Linhas da tabela
    dadosPedido.pagamento.forEach((pagamento, index) => {
      // Verifica se a posição Y está próxima do final da página
      if (startY > doc.page.height - 70) {
        // Se estiver a 100 pixels do final
        doc.addPage(); // Adiciona uma nova página
        startY = 40; // Reinicia a posição Y
      }
      // Configuração da descrição do produto
      const meioText = `${pagamento.meio}`;
      const textOptions = { width: 400, align: "left" };
      const textHeight = doc.heightOfString(meioText, textOptions);

      doc
        .font("Helvetica")
        .fillColor("#525252")
        .fontSize(14)
        .text(meioText, 10, startY + 5, textOptions);

      const adjustedY = startY + textHeight + 15;

      doc
        .font("Helvetica")
        .fillColor("#525252")
        .fontSize(14)
        .text(`${pagamento.valor}`, 210, startY + 5);

      // Se **não** for o último item, desenha a linha separadora
      if (index < dadosPedido.pagamento.length - 1) {
        doc
          .strokeColor("#d6d6d6")
          .lineWidth(0.5)
          .moveTo(10, adjustedY - 5)
          .lineTo(300, adjustedY - 5) // Linha mais longa para acompanhar o novo layout
          .stroke();
      }

      // Atualizando a posição para o próximo item
      startY = adjustedY + 5;
    });

    doc.end();

    stream.on("finish", () => {
      resolve(filePath);
    });

    stream.on("error", (err) => {
      reject(err);
    });
  });
}

module.exports = {
  gerarPDF,
};
