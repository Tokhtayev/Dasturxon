import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Paperclip, ReceiptText } from 'lucide-react';
import { ReceiptPreviewModal } from '../../components/ReceiptPreviewModal';
import { StatusChip } from '../../components/StatusChip';
import { PaymentReceiptModal } from '../../components/owner/PaymentReceiptModal';
import { formatSoM } from '../../services/analytics';
import { TERMINAL_ORDER_STATUSES } from '../../services/constants';
import { getReadableErrorMessage } from '../../services/errors';
import { calculateOrderPrepayment } from '../../services/orderLogic';
import { formatContactPhoneDisplay } from '../../services/validators';
import type { CustomerOrder, OrderStatusKey, PrepaymentStatus } from '../../types/domain';
import type { OwnerContextType } from './OwnerLayout';

const NEXT_ORDER_STEP: Partial<Record<OrderStatusKey, { next: OrderStatusKey; label: string }>> = {
  pending: { next: 'accepted', label: 'Qabul qilish' },
  accepted: { next: 'ready', label: 'Tayyor' },
  ready: { next: 'completed', label: 'Yakunlash' },
};

export const OwnerOrdersPage: React.FC = () => {
  const { orders, advanceOrder, cancelOrder, setPaymentStatus, setPrepaymentStatus } =
    useOutletContext<OwnerContextType>();
  const [segment, setSegment] = useState<'new' | 'progress' | 'history'>('new');
  const [actionError, setActionError] = useState<string | null>(null);
  const [receiptModal, setReceiptModal] = useState<{
    order: CustomerOrder;
    mode: 'confirm_payment' | 'edit_receipt';
  } | null>(null);
  const [previewTarget, setPreviewTarget] = useState<{
    order: CustomerOrder;
    kind: 'full' | 'advance';
  } | null>(null);

  const newOrders = orders.filter((o) => o.status === 'pending');
  const progressOrders = orders.filter((o) => o.status === 'accepted' || o.status === 'ready');
  const historyOrders = orders.filter((o) => TERMINAL_ORDER_STATUSES.includes(o.status));
  const list =
    segment === 'new' ? newOrders : segment === 'progress' ? progressOrders : historyOrders;

  const runAction = async (work: () => Promise<void>) => {
    setActionError(null);
    try {
      await work();
    } catch (err) {
      setActionError(getReadableErrorMessage(err, 'Buyurtmani yangilab bo‘lmadi.'));
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-extrabold">Buyurtmalar ({orders.length})</h1>

      {actionError && (
        <div
          className="p-3 rounded-2xl text-xs font-bold"
          style={{
            backgroundColor: 'var(--dx-error-container)',
            color: 'var(--dx-on-error-container)',
          }}
        >
          {actionError}
        </div>
      )}

      <OwnerOrderTabs
        segment={segment}
        newCount={newOrders.length}
        progressCount={progressOrders.length}
        historyCount={historyOrders.length}
        onSelect={setSegment}
      />

      {list.length === 0 ? (
        <div
          className="rounded-3xl p-10 text-center border"
          style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
        >
          <div className="font-bold text-sm">Bu bo‘limda buyurtmalar yo‘q</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {list.map((order) => (
            <OwnerOrderCard
              key={order.id}
              order={order}
              onOpenConfirmPayment={(target) =>
                setReceiptModal({ order: target, mode: 'confirm_payment' })
              }
              onOpenUploadReceipt={(target) =>
                setReceiptModal({ order: target, mode: 'edit_receipt' })
              }
              onPreviewReceipt={(target, kind) => setPreviewTarget({ order: target, kind })}
              onMarkUnpaid={(id) => void runAction(() => setPaymentStatus(id, 'unpaid'))}
              onSetPrepayment={(id, next) => void runAction(() => setPrepaymentStatus(id, next))}
              onAdvance={(id, prodId, next) => void runAction(() => advanceOrder(id, prodId, next))}
              onCancel={(id) => void runAction(() => cancelOrder(id))}
            />
          ))}
        </div>
      )}

      {receiptModal && (
        <PaymentReceiptModal
          order={receiptModal.order}
          mode={receiptModal.mode}
          onClose={() => setReceiptModal(null)}
          onConfirm={(receiptUrl) =>
            setPaymentStatus(receiptModal.order.id, 'paid', {
              receiptUrl,
              preservePaidAt: receiptModal.mode === 'edit_receipt',
            })
          }
        />
      )}

      {previewTarget && (
        <ReceiptPreviewModal
          order={previewTarget.order}
          kind={previewTarget.kind}
          onClose={() => setPreviewTarget(null)}
          onReplaceReceipt={
            previewTarget.kind === 'full'
              ? () => {
                  const target = previewTarget.order;
                  setPreviewTarget(null);
                  setReceiptModal({ order: target, mode: 'edit_receipt' });
                }
              : undefined
          }
        />
      )}
    </div>
  );
};

const OwnerOrderTabs: React.FC<{
  segment: 'new' | 'progress' | 'history';
  newCount: number;
  progressCount: number;
  historyCount: number;
  onSelect: (seg: 'new' | 'progress' | 'history') => void;
}> = ({ segment, newCount, progressCount, historyCount, onSelect }) => (
  <div className="flex gap-2 border-b pb-3" style={{ borderColor: 'var(--dx-border)' }}>
    {(
      [
        ['new', `Yangi (${newCount})`],
        ['progress', `Jarayonda (${progressCount})`],
        ['history', `Tarix (${historyCount})`],
      ] as const
    ).map(([key, label]) => (
      <button
        key={key}
        type="button"
        onClick={() => onSelect(key)}
        className="px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer"
        style={{
          backgroundColor: segment === key ? 'var(--dx-primary)' : 'var(--dx-surface)',
          color: segment === key ? 'var(--dx-on-primary)' : 'var(--dx-text)',
        }}
      >
        {label}
      </button>
    ))}
  </div>
);

const OwnerOrderPaymentActions: React.FC<{
  order: CustomerOrder;
  isTerminal: boolean;
  onOpenConfirmPayment: (order: CustomerOrder) => void;
  onOpenUploadReceipt: (order: CustomerOrder) => void;
  onPreviewReceipt: (order: CustomerOrder, kind: 'full' | 'advance') => void;
  onMarkUnpaid: (orderId: string) => void;
}> = ({
  order,
  isTerminal,
  onOpenConfirmPayment,
  onOpenUploadReceipt,
  onPreviewReceipt,
  onMarkUnpaid,
}) => {
  const canAttachReceiptLater =
    order.paymentStatus === 'paid' && order.status !== 'rejected' && order.status !== 'cancelled';

  return (
    <>
      {!isTerminal && order.paymentStatus !== 'paid' && (
        <button
          type="button"
          onClick={() => onOpenConfirmPayment(order)}
          className="px-2.5 py-1 rounded-xl border font-bold cursor-pointer"
          style={{
            backgroundColor: 'var(--dx-bg)',
            borderColor: 'var(--dx-border)',
            color: 'var(--dx-text)',
          }}
        >
          {order.prepaymentStatus === 'advance_paid'
            ? 'Qolgan 50% / To‘liq to‘lov'
            : 'To‘lovni tasdiqlash'}
        </button>
      )}

      {!isTerminal && order.paymentStatus === 'paid' && (
        <button
          type="button"
          title="To‘lanmagan holatga qaytarish"
          onClick={() => onMarkUnpaid(order.id)}
          className="px-2.5 py-1 rounded-xl border font-bold cursor-pointer"
          style={{
            backgroundColor: 'var(--dx-tertiary-container)',
            borderColor: 'var(--dx-border)',
            color: 'var(--dx-on-tertiary-container)',
          }}
        >
          ✅ To‘langan
        </button>
      )}

      {isTerminal && order.paymentStatus === 'paid' && (
        <span
          className="px-2.5 py-1 rounded-xl border font-bold"
          style={{
            backgroundColor: 'var(--dx-tertiary-container)',
            borderColor: 'var(--dx-border)',
            color: 'var(--dx-on-tertiary-container)',
          }}
        >
          ✅ To‘langan
        </span>
      )}

      {order.paymentStatus === 'paid' && order.receiptUrl && (
        <button
          type="button"
          onClick={() => onPreviewReceipt(order, 'full')}
          className="px-2.5 py-1 rounded-xl border font-bold inline-flex items-center gap-1 cursor-pointer"
          style={{
            backgroundColor: 'var(--dx-bg)',
            borderColor: 'var(--dx-border)',
            color: 'var(--dx-primary)',
          }}
        >
          <ReceiptText className="w-3.5 h-3.5" /> Chek
        </button>
      )}

      {canAttachReceiptLater && !order.receiptUrl && (
        <button
          type="button"
          onClick={() => onOpenUploadReceipt(order)}
          className="px-2.5 py-1 rounded-xl border font-bold inline-flex items-center gap-1 cursor-pointer"
          style={{
            backgroundColor: 'var(--dx-bg)',
            borderColor: 'var(--dx-border)',
            color: 'var(--dx-text)',
          }}
        >
          <Paperclip className="w-3.5 h-3.5" /> Chek yuklash
        </button>
      )}
    </>
  );
};

const OwnerAdvanceBox: React.FC<{
  order: CustomerOrder;
  isTerminal: boolean;
  onPreviewAdvance: () => void;
  onSetPrepayment: (status: PrepaymentStatus) => void;
}> = ({ order, isTerminal, onPreviewAdvance, onSetPrepayment }) => {
  if (order.paymentStatus === 'paid' || (isTerminal && !order.advanceReceiptUrl)) return null;
  const adv = order.prepaymentAmount ?? calculateOrderPrepayment(order.totalPrice).prepaymentAmount;
  const rem = Math.max(0, order.totalPrice - adv);
  const prepStatus = order.prepaymentStatus ?? 'awaiting_advance';

  return (
    <div
      className="p-2.5 rounded-xl border text-xs flex flex-wrap items-center justify-between gap-2"
      style={{
        backgroundColor:
          prepStatus === 'advance_paid'
            ? 'var(--dx-tertiary-container)'
            : 'var(--dx-secondary-container)',
        borderColor: 'var(--dx-border)',
      }}
    >
      <div className="space-y-0.5">
        <div className="font-bold">
          {prepStatus === 'advance_paid'
            ? `✅ 50% Avans olindi (${formatSoM(adv)}) · Qolgan: ${formatSoM(rem)}`
            : prepStatus === 'advance_submitted'
              ? `📩 50% Avans cheki yuborildi (${formatSoM(adv)})`
              : `⚠️ 50% Avans kutilmoqda (${formatSoM(adv)}) · Qolgan: ${formatSoM(rem)}`}
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {order.advanceReceiptUrl && (
          <button
            type="button"
            onClick={onPreviewAdvance}
            className="px-2.5 py-1 rounded-xl border text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
            style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
          >
            <ReceiptText className="w-3 h-3" /> Avans cheki
          </button>
        )}
        {!isTerminal && prepStatus !== 'advance_paid' && (
          <button
            type="button"
            onClick={() => onSetPrepayment('advance_paid')}
            className="px-2.5 py-1 rounded-xl text-[11px] font-bold cursor-pointer"
            style={{ backgroundColor: 'var(--dx-primary)', color: 'var(--dx-on-primary)' }}
          >
            50% Avansni tasdiqlash
          </button>
        )}
        {!isTerminal && prepStatus === 'advance_paid' && (
          <button
            type="button"
            onClick={() =>
              onSetPrepayment(order.advanceReceiptUrl ? 'advance_submitted' : 'awaiting_advance')
            }
            className="px-2 py-1 rounded-xl border text-[11px] font-bold cursor-pointer"
            style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
          >
            Bekor qilish
          </button>
        )}
      </div>
    </div>
  );
};

const OwnerOrderCard: React.FC<{
  order: CustomerOrder;
  onOpenConfirmPayment: (order: CustomerOrder) => void;
  onOpenUploadReceipt: (order: CustomerOrder) => void;
  onPreviewReceipt: (order: CustomerOrder, kind: 'full' | 'advance') => void;
  onMarkUnpaid: (orderId: string) => void;
  onSetPrepayment: (orderId: string, status: PrepaymentStatus) => void;
  onAdvance: (orderId: string, productId: string, next: OrderStatusKey) => void;
  onCancel: (orderId: string) => void;
}> = ({
  order,
  onOpenConfirmPayment,
  onOpenUploadReceipt,
  onPreviewReceipt,
  onMarkUnpaid,
  onSetPrepayment,
  onAdvance,
  onCancel,
}) => {
  const nextStep = NEXT_ORDER_STEP[order.status];
  const isTerminal = TERMINAL_ORDER_STATUSES.includes(order.status);
  const phoneDisplay = formatContactPhoneDisplay(order.customerPhone);

  return (
    <div
      className="p-4 rounded-2xl border space-y-3"
      style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div
            className="text-xs font-bold flex items-center gap-1.5"
            style={{ color: 'var(--dx-muted)' }}
          >
            <span>
              #{order.id.slice(0, 6).toUpperCase()} · {order.customerName || 'Xaridor'}
            </span>
            {order.orderType === 'wholesale' && (
              <span
                className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md"
                style={{
                  backgroundColor: 'var(--dx-secondary-container)',
                  color: 'var(--dx-on-secondary-container)',
                }}
              >
                📦 OPTOM
              </span>
            )}
          </div>
          <div className="font-bold text-sm mt-0.5">
            {order.productName} ({order.quantity} ta)
          </div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--dx-muted)' }}>
            {order.fulfillmentType === 'delivery'
              ? `🚚 ${order.deliveryAddress}`
              : '🛍️ Olib ketish'}{' '}
            ·{' '}
            {phoneDisplay ? (
              <a
                href={`tel:${phoneDisplay.replace(/\s+/g, '')}`}
                className="underline font-semibold"
              >
                {phoneDisplay}
              </a>
            ) : (
              'Telefon kiritilmagan'
            )}
          </div>
        </div>
        <StatusChip status={order.status} />
      </div>

      <OwnerAdvanceBox
        order={order}
        isTerminal={isTerminal}
        onPreviewAdvance={() => onPreviewReceipt(order, 'advance')}
        onSetPrepayment={(next) => onSetPrepayment(order.id, next)}
      />

      <div
        className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t text-xs"
        style={{ borderColor: 'var(--dx-border)' }}
      >
        <span className="font-extrabold text-sm" style={{ color: 'var(--dx-primary)' }}>
          {formatSoM(order.totalPrice)}
        </span>

        <div className="flex flex-wrap gap-1.5">
          <OwnerOrderPaymentActions
            order={order}
            isTerminal={isTerminal}
            onOpenConfirmPayment={onOpenConfirmPayment}
            onOpenUploadReceipt={onOpenUploadReceipt}
            onPreviewReceipt={onPreviewReceipt}
            onMarkUnpaid={onMarkUnpaid}
          />

          {nextStep && (
            <button
              type="button"
              onClick={() => onAdvance(order.id, order.productId, nextStep.next)}
              className="px-3 py-1 rounded-xl font-bold cursor-pointer"
              style={{ backgroundColor: 'var(--dx-primary)', color: 'var(--dx-on-primary)' }}
            >
              {nextStep.label}
            </button>
          )}

          {!isTerminal && (
            <button
              type="button"
              onClick={() => onCancel(order.id)}
              className="px-2.5 py-1 rounded-xl border font-bold cursor-pointer"
              style={{ borderColor: 'var(--dx-error)', color: 'var(--dx-error)' }}
            >
              Bekor qilish
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
