import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';
import { messagesApi } from '../../api/messages';
import { useState } from 'react';

export default function CarReviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [messageBody, setMessageBody] = useState('');

  const { data: car, isLoading } = useQuery({
    queryKey: ['adminCar', id],
    queryFn: () => adminApi.getCar(Number(id)),
    enabled: !!id,
  });

  const sendMsgMutation = useMutation({
    mutationFn: () => messagesApi.send({
      receiverId: car!.userId,
      carId: car!.id,
      subject: `Re: ${car!.year} ${car!.make} ${car!.model}`,
      body: messageBody,
    }),
    onSuccess: () => {
      setMessageBody('');
      alert('Message sent!');
    },
  });

  if (isLoading) return <div className="text-center py-12 text-gray-500">Loading...</div>;
  if (!car) return <div className="text-center py-12 text-red-500">Car not found</div>;

  const statusColors: Record<string, string> = {
    Pending: 'bg-yellow-100 text-yellow-800',
    Reviewed: 'bg-blue-100 text-blue-800',
    Offered: 'bg-purple-100 text-purple-800',
    Consigned: 'bg-indigo-100 text-indigo-800',
    Sold: 'bg-green-100 text-green-800',
    Rejected: 'bg-red-100 text-red-800',
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <Link to="/admin" className="text-blue-600 hover:underline text-sm">← Back to Dashboard</Link>
          <h1 className="text-3xl font-bold mt-2">{car.year} {car.make} {car.model}</h1>
          <p className="text-gray-500">Submitted by {car.userName}</p>
          <span className={`inline-block mt-2 text-sm px-3 py-1 rounded-full ${statusColors[car.status] || 'bg-gray-100'}`}>
            {car.status}
          </span>
        </div>
        <div className="flex space-x-2">
          <Link to={`/admin/cars/${car.id}/offer`} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm">
            💰 Make Offer
          </Link>
        </div>
      </div>

      {/* Images */}
      {car.images.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Photos ({car.images.length})</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {car.images.map((img) => (
              <img key={img.id} src={img.blobUrl} alt={img.fileName} className="w-full h-40 object-cover rounded-lg" />
            ))}
          </div>
        </div>
      )}

      {/* Details */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Vehicle Details</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-500">Make:</span> <span className="font-medium">{car.make}</span></div>
          <div><span className="text-gray-500">Model:</span> <span className="font-medium">{car.model}</span></div>
          <div><span className="text-gray-500">Year:</span> <span className="font-medium">{car.year}</span></div>
          <div><span className="text-gray-500">Mileage:</span> <span className="font-medium">{car.mileage.toLocaleString()} mi</span></div>
          {car.vin && <div><span className="text-gray-500">VIN:</span> <span className="font-medium">{car.vin}</span></div>}
          {car.color && <div><span className="text-gray-500">Color:</span> <span className="font-medium">{car.color}</span></div>}
          {car.condition && <div><span className="text-gray-500">Condition:</span> <span className="font-medium">{car.condition}</span></div>}
          {car.askingPrice && <div><span className="text-gray-500">Asking:</span> <span className="font-medium text-green-600">${car.askingPrice.toLocaleString()}</span></div>}
        </div>
        {car.description && <p className="mt-4 text-gray-700 border-t pt-4">{car.description}</p>}
      </div>

      {/* Existing Offers */}
      {car.offers && car.offers.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Previous Offers</h2>
          {car.offers.map((offer) => (
            <div key={offer.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg mb-2">
              <div>
                <span className="font-bold text-green-600">${offer.amount.toLocaleString()}</span>
                {offer.notes && <span className="text-sm text-gray-500 ml-3">{offer.notes}</span>}
              </div>
              <span className="text-sm text-gray-400">{offer.status} · {new Date(offer.createdAt).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}

      {/* Quick Message */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Send Message to Owner</h2>
        <textarea
          value={messageBody}
          onChange={(e) => setMessageBody(e.target.value)}
          rows={3}
          placeholder="Type your message..."
          className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none mb-3"
        />
        <button
          onClick={() => sendMsgMutation.mutate()}
          disabled={!messageBody.trim() || sendMsgMutation.isPending}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
        >
          Send Message
        </button>
      </div>
    </div>
  );
}
