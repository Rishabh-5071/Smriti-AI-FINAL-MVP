import { useUser } from '../context/UserContext'
import { MessageSquare, Users } from 'lucide-react'

const Conversations = () => {
  const { user } = useUser()
  const relations = user?.relations || []

  const relationsWithMessages = relations.filter(
    (rel) => rel.messages && rel.messages.length > 0
  )

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-100 mb-2">Conversations</h1>
        <p className="text-gray-400">
          View conversation history with family members and caregivers
        </p>
      </div>

      {relationsWithMessages.length === 0 ? (
        <div className="card text-center py-12">
          <div className="flex flex-col items-center gap-4 mb-4">
            <img 
              src="/Smriti.png" 
              alt="Smriti Logo" 
              className="w-16 h-16 object-contain opacity-50"
            />
            <MessageSquare className="w-12 h-12 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-100 mb-2">
            No Conversations Yet
          </h2>
          <p className="text-gray-400">
            Conversations will appear here once face recognition detects familiar faces
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {relationsWithMessages.map((relation) => (
            <div key={relation.id} className="card">
              <div className="flex items-start gap-4 mb-4">
                {relation.photo ? (
                  <img
                    src={relation.photo}
                    alt={relation.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-gray-100">
                    {relation.name}
                  </h3>
                  <p className="text-sm text-gray-400">{relation.relationship}</p>
                </div>
              </div>

              {relation.summary && (
                <div className="mb-4 p-4 bg-primary-900/30 rounded-lg border border-primary-700">
                  <p className="text-sm font-medium text-primary-200 mb-1">
                    Conversation Summary
                  </p>
                  <p className="text-sm text-primary-100">{relation.summary}</p>
                </div>
              )}

              {relation.messages && relation.messages.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">
                    Messages ({relation.messages.length})
                  </h4>
                  {relation.messages.map((message, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-gray-700 rounded-lg border border-gray-600"
                    >
                      {typeof message === 'string' ? (
                        <p className="text-sm text-gray-200">{message}</p>
                      ) : (
                        <div>
                          {message.message && (
                            <p className="text-sm text-gray-200 mb-2">
                              {message.message}
                            </p>
                          )}
                          {message.summary && (
                            <p className="text-xs text-gray-400 italic">
                              Summary: {message.summary}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {relation.count && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <p className="text-xs text-gray-400">
                    Total interactions: {relation.count.value}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Conversations

