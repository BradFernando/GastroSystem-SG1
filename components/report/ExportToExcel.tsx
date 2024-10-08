"use client";

// Importaciones necesarias
import React from 'react';
import ExcelJS, { Workbook, Worksheet } from 'exceljs';
import { FaFileExcel } from 'react-icons/fa';
import { saveAs } from 'file-saver';

// Definición de tipos para los productos
interface Product {
  name: string;
  category: { name: string };
  price: number;
  stock: number | null; // Campo de stock añadido
}

// Propiedades del componente ExportToExcel
interface ExportToExcelProps {
  data: Product[];
}

// Componente principal ExportToExcel
const ExportToExcel: React.FC<ExportToExcelProps> = ({ data }) => {
  // Función para exportar a Excel
  const exportToExcel = async () => {
    if (!data) return;

    // Crear nuevo libro de Excel y hoja de trabajo
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Listado de productos');

    // Estilos para el título y descripción
    const titleStyle: Partial<ExcelJS.Style> = {
      font: { name: 'Arial', size: 18, bold: true },
      alignment: { horizontal: 'center', vertical: 'middle' },
    };

    const descriptionStyle: Partial<ExcelJS.Style> = {
      font: { name: 'Arial', size: 11, italic: true },
      alignment: { horizontal: 'center', vertical: 'middle' },
    };

    // Estilos para el encabezado
    const headerStyle: Partial<ExcelJS.Style> = {
      font: { bold: true, color: { argb: 'FFFFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2A6D8E' } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } },
    };

    // Estilos para las celdas de datos
    const bodyStyle: Partial<ExcelJS.Style> = {
      alignment: { vertical: 'middle', wrapText: true },
      border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } },
    };

    // Agregar título
    worksheet.mergeCells('A1:F1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'Listado de Productos';
    titleCell.style = titleStyle;

    // Agregar descripción
    worksheet.mergeCells('A2:F2');
    const descriptionCell = worksheet.getCell('A2');
    descriptionCell.value = 'Detalles de Inversión y Stock de Productos';
    descriptionCell.style = descriptionStyle;

    // Agregar encabezados
    const headerRow = worksheet.addRow(['N°', 'Producto', 'Categoría', 'Stock', 'Precio', 'Total']);
    headerRow.eachCell((cell) => {
      cell.style = headerStyle;
    });

    // Agregar datos de productos
    data.forEach((product, index) => {
      const stockValue = product.stock !== null ? product.stock : 'N/a';
      const totalValue = product.stock !== null ? (product.price * product.stock).toFixed(2) : product.price.toFixed(2);
      const row = worksheet.addRow([
        index + 1,
        product.name,
        product.category.name,
        stockValue,
        product.price.toFixed(2),
        totalValue,
      ]);
      row.eachCell((cell, colNumber) => {
        if (colNumber === 2 || colNumber === 3) {
          cell.alignment = { ...bodyStyle.alignment, wrapText: true };
        }
        cell.style = bodyStyle;
      });
    });

    // Ajustar el ancho de las columnas automáticamente
    adjustColumnsWidth(worksheet);

    // Generar y descargar el archivo Excel
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, 'Listado_de_productos.xlsx');
  };

  // Función para ajustar el ancho de las columnas basado en los anchos específicos
  const adjustColumnsWidth = (worksheet: Worksheet) => {
    const colWidths = [
      { width: 8 },  // Ancho para N°
      { width: 40 }, // Ancho para Producto
      { width: 20 }, // Ancho para Categoría
      { width: 10 }, // Ancho para Stock
      { width: 10 }, // Ancho para Precio
      { width: 15 }, // Ancho para Total
    ];

    worksheet.columns.forEach((column, colNumber) => {
      if (colWidths[colNumber] && colWidths[colNumber].width) {
        column.width = colWidths[colNumber].width;
      } else {
        // Ancho por defecto para otras columnas
        column.width = 15;
      }
    });
  };

  return (
      <button
          onClick={exportToExcel}
          className="py-2 px-4 bg-green-500 text-white rounded flex items-center hover:bg-lime-500"
      >
        <FaFileExcel style={{ fontSize: '24px', color: 'green', marginRight: '8px' }} /> Exportar a Excel
      </button>
  );
};

export default ExportToExcel;
