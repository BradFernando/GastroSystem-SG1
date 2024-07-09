"use client"

import { useState, useMemo } from "react";
import { useStore } from "@/src/store";
import ProductDetails from "./ProductDetails";
import { formatCurrecy } from "@/src/utils";
import { createOrder } from "@/actions/create-order-action";
import { OrderSchema } from "@/src/schema";
import { toast } from "react-toastify";
import ImageUploadOrder from './ImageUploadOrder';

export default function OrderSummary() {
    const order = useStore(state => state.order);
    const clearOrder = useStore(state => state.clearOrder);

    const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
    const [transferImage, setTransferImage] = useState<string>("");
    const [paymentDescription, setPaymentDescription] = useState<string>("");
    const [selectedTable, setSelectedTable] = useState<string | null>(null);
    const [chatId, setChatId] = useState<string>("");

    const total = useMemo(() => {
        let totalAmount = 0;
        let entréeCount = 0;
        let mainCourseCount = 0;
        let otherCategoryTotal = 0;

        order.forEach((item) => {
            if (item.categoryId === 4) {
                entréeCount += item.quantity;
            } else if (item.categoryId === 5) {
                mainCourseCount += item.quantity;
            } else {
                otherCategoryTotal += item.quantity * item.price;
            }
        });

        const minCount = Math.min(entréeCount, mainCourseCount);
        const maxCount = Math.max(entréeCount, mainCourseCount);
        const diffCount = maxCount - minCount;

        if (entréeCount === mainCourseCount) {
            totalAmount = minCount * 2.50;
        } else {
            totalAmount = minCount * 2.50 + diffCount * 2;
        }

        totalAmount += otherCategoryTotal;

        return totalAmount;
    }, [order]);

    const handleImageUpload = (imageUrl: string) => {
        setTransferImage(imageUrl);
    };

    const handleCreateOrder = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!paymentMethod) {
            toast.error("Seleccione un método de pago.");
            return;
        }

        if (!selectedTable) {
            toast.error("Seleccione una mesa.");
            return;
        }

        if (selectedTable === 'Mesa 1' && !chatId) {
            toast.error("Ingrese el ID de chat para Mesa 1.");
            return;
        }

        const data = {
            name: event.currentTarget.name.value,
            total,
            order,
            paymentMethod,
            transferImage: paymentMethod === "transferencia" ? transferImage : "",
            paymentDescription,
            table: selectedTable,
            chatId: selectedTable === 'Mesa 1' ? chatId : null,
        };

        const result = OrderSchema.safeParse(data);

        if (!result.success) {
            result.error.issues.forEach((issue) => {
                toast.error(issue.message);
            });
            return;
        }

        const response = await createOrder(data);

        if (response?.errors) {
            response.errors.forEach((issue) => {
                toast.error(issue.message);
            });
            return;
        }

        toast.success("Pedido creado con éxito");

        if (selectedTable === 'Mesa 1') {
            await sendOrderToTelegram(data);
        }

        clearOrder();
        setPaymentMethod(null);
        setTransferImage("");
        setPaymentDescription("");
        setSelectedTable(null);
        setChatId("");
    };

    const sendOrderToTelegram = async (data: any) => {
        try {
            const response = await fetch('/api/send-order-to-telegram-mesa1', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error('Error al enviar el pedido al bot de Telegram.');
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error('Error desconocido al enviar el pedido.');
            }
        }
    };

    return (
        <aside className="lg:h-screen lg:overflow-y-scroll md:w-64 lg:w-96 p-5">
            <h1 className="text-4xl text-center font-black">Mi Pedido</h1>

            {order.length === 0 ? <p className="text-center my-10">El pedido está vacío</p> : (
                <div className="mt-5">
                    {order.map(item => (
                        <ProductDetails
                            key={item.id}
                            item={item}
                        />
                    ))}

                    <p className="text-2xl mt-20 text-center">
                        Total a pagar: {' '}
                        <span className="font-bold">{formatCurrecy(total)}</span>
                    </p>

                    <form className="w-full mt-10 space-y-5" onSubmit={handleCreateOrder}>
                        <input
                            type="text"
                            placeholder="Tu Nombre"
                            className="bg-white border border-gray-100 p-2 w-full"
                            name="name"
                        />

                        <div className="flex flex-col space-y-2">
                            <label className="block">Selecciona una Mesa:</label>
                            <div className="flex space-x-2">
                                {["Mesa 1", "Mesa 2", "Mesa 3", "Ninguna"].map(table => (
                                    <button
                                        key={table}
                                        type="button"
                                        className={`py-2 rounded uppercase text-white bg-black w-full text-center cursor-pointer ${selectedTable === table ? "bg-gray-800" : ""}`}
                                        onClick={() => setSelectedTable(table)}
                                    >
                                        {table}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {selectedTable === "Mesa 1" && (
                            <input
                                type="text"
                                placeholder="ID de Chat de Telegram"
                                className="bg-white border border-gray-100 p-2 w-full"
                                value={chatId}
                                onChange={(e) => setChatId(e.target.value)}
                            />
                        )}

                        <div className="flex items-center justify-between space-x-4">
                            <label className="block">Método de Pago:</label>
                            <div className="flex space-x-4">
                                <button
                                    type="button"
                                    className={`py-2 rounded uppercase text-white bg-black w-full text-center cursor-pointer ${paymentMethod === "transferencia" ? "bg-gray-800" : ""}`}
                                    onClick={() => setPaymentMethod("transferencia")}
                                >
                                    Transferencia Bancaria
                                </button>
                                <button
                                    type="button"
                                    className={`py-2 rounded uppercase text-white bg-black w-full text-center cursor-pointer ${paymentMethod === "efectivo" ? "bg-gray-800" : ""}`}
                                    onClick={() => setPaymentMethod("efectivo")}
                                >
                                    Efectivo
                                </button>
                            </div>
                        </div>

                        {paymentMethod === "transferencia" && (
                            <div className="space-y-2">
                                <label>Imagen de Transferencia:</label>
                                <ImageUploadOrder onUpload={handleImageUpload} />
                                <textarea
                                    placeholder="Descripción del Pago en Transferencia"
                                    className="bg-white border border-gray-100 p-2 w-full"
                                    value={paymentDescription}
                                    onChange={(e) => setPaymentDescription(e.target.value)}
                                />
                            </div>
                        )}

                        {paymentMethod === "efectivo" && (
                            <textarea
                                placeholder="Descripción del Pago en Efectivo"
                                className="bg-white border border-gray-100 p-2 w-full"
                                value={paymentDescription}
                                onChange={(e) => setPaymentDescription(e.target.value)}
                            />
                        )}

                        <input
                            type="submit"
                            className="py-2 rounded uppercase text-white bg-black w-full text-center cursor-pointer"
                            value="Confirmar Pedido"
                        />
                    </form>
                </div>
            )}
        </aside>
    );
}